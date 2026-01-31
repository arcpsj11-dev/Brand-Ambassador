import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { analyzeCompetitors, type CompetitorAnalysisResult } from '../services/competitorAnalysisService';
import { geminiReasoningService } from '../services/geminiService';

interface CoachingRecommendation {
    category: string;
    issue: string;
    action: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
}

interface CompetitorState {
    currentAnalysis: CompetitorAnalysisResult | null;
    coaching: {
        overallScore: number;
        targetScore: number;
        recommendations: CoachingRecommendation[];
    } | null;
    isAnalyzing: boolean;
    error: string | null;
    lastAnalyzedKeyword: string | null;
    lastAnalyzedAt: string | null;

    // Actions
    analyzeCompetitors: (keyword: string, myContent: {
        wordCount: number;
        imageCount: number;
        hasVideo: boolean;
        keywordFrequency: number;
    }) => Promise<void>;
    clearAnalysis: () => void;
    getAnalysisCache: (keyword: string) => CompetitorAnalysisResult | null;
}

export const useCompetitorStore = create<CompetitorState>()(
    persist(
        (set, get) => ({
            currentAnalysis: null,
            coaching: null,
            isAnalyzing: false,
            error: null,
            lastAnalyzedKeyword: null,
            lastAnalyzedAt: null,

            analyzeCompetitors: async (keyword, myContent) => {
                set({ isAnalyzing: true, error: null });

                try {
                    // 1. 경쟁사 데이터 수집
                    const analysisResult = await analyzeCompetitors(keyword, myContent);

                    // 2. AI 코칭 생성
                    const coachingResult = await geminiReasoningService.generateCompetitorCoaching({
                        keyword,
                        myContent,
                        topAverage: analysisResult.topAverage,
                        myScore: analysisResult.myScore
                    });

                    // 3. 상태 업데이트
                    set({
                        currentAnalysis: analysisResult,
                        coaching: coachingResult,
                        isAnalyzing: false,
                        error: null,
                        lastAnalyzedKeyword: keyword,
                        lastAnalyzedAt: new Date().toISOString()
                    });
                } catch (error: any) {
                    console.error('[useCompetitorStore] Analysis Error:', error);
                    set({
                        isAnalyzing: false,
                        error: error.message || '알 수 없는 오류가 발생했습니다.',
                        currentAnalysis: null,
                        coaching: null
                    });
                    // throw error; // 컴포넌트에서 에러 처리 하므로 throw 안함
                }
            },

            clearAnalysis: () => {
                set({
                    currentAnalysis: null,
                    coaching: null,
                    lastAnalyzedKeyword: null,
                    lastAnalyzedAt: null
                });
            },

            getAnalysisCache: (keyword) => {
                const { currentAnalysis, lastAnalyzedKeyword, lastAnalyzedAt } = get();

                // 캐시 유효성 검사 (1시간)
                if (
                    currentAnalysis &&
                    lastAnalyzedKeyword === keyword &&
                    lastAnalyzedAt
                ) {
                    const hourAgo = Date.now() - (60 * 60 * 1000);
                    const analyzedTime = new Date(lastAnalyzedAt).getTime();

                    if (analyzedTime > hourAgo) {
                        return currentAnalysis;
                    }
                }

                return null;
            }
        }),
        {
            name: 'competitor-analysis-storage',
            partialize: (state) => ({
                currentAnalysis: state.currentAnalysis,
                coaching: state.coaching,
                lastAnalyzedKeyword: state.lastAnalyzedKeyword,
                lastAnalyzedAt: state.lastAnalyzedAt
            })
        }
    )
);
