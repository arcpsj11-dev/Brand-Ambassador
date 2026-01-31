import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { useAdminStore } from '../store/useAdminStore';
import { naverBlogService } from './naverBlogService';

export interface BlogScoreAnalysis {
    score: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'needs_improvement';
    motivationalMessage: string;
    insights: string[];
    lastUpdated: string;
}

const BLOG_SCORE_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        score: { type: SchemaType.NUMBER },
        status: { type: SchemaType.STRING, enum: ['excellent', 'good', 'fair', 'needs_improvement'] },
        motivationalMessage: { type: SchemaType.STRING },
        insights: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
        }
    },
    required: ['score', 'status', 'motivationalMessage', 'insights']
};

/**
 * Blog Score Service - Lightweight motivation system
 * Uses Gemini to analyze blog health and provide encouraging feedback
 */
export const blogScoreService = {
    /**
     * Analyze blog and calculate motivational score
     */
    async analyzeBlog(blogId: string): Promise<BlogScoreAnalysis> {
        try {
            // 1. Fetch blog data from Naver
            const blogData = await naverBlogService.fetchBlogPosts(blogId);

            // 2. Format data for Gemini analysis
            const context = naverBlogService.formatForAnalysis(blogData);

            // 3. Get Gemini analysis
            const geminiResult = await this.getGeminiAnalysis(context, blogData.items.length);

            return {
                ...geminiResult,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('[BlogScoreService] Analysis failed:', error);
            return {
                ...this.getFallbackAnalysis(),
                lastUpdated: new Date().toISOString()
            };
        }
    },

    /**
     * Get Gemini analysis with "10-year marketing expert" persona
     */
    async getGeminiAnalysis(blogContext: string, postCount: number): Promise<Omit<BlogScoreAnalysis, 'lastUpdated'>> {
        const adminKey = useAdminStore.getState().geminiApiKey;
        const envKey = import.meta.env.VITE_GEMINI_API_KEY;
        const finalKey = adminKey || envKey;

        if (!finalKey) {
            console.warn('[BlogScoreService] Gemini API key not configured. Using fallback.');
            return this.getFallbackAnalysis();
        }

        try {
            const genAI = new GoogleGenerativeAI(finalKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: BLOG_SCORE_SCHEMA as any
                },
                systemInstruction: `너는 10년 차 네이버 마케팅 전문가이자 블로그 성장 코치야.
                
핵심 원칙:
1. 항상 긍정적이고 동기부여하는 톤으로 답해
2. 점수를 매길 때 과도하게 낮게 주지 말 것 (최소 50점 이상)
3. 스트레스를 주지 않고 행동을 유도하는 메시지 작성
4. "오늘 한 게시물이면 충분해요!" 같은 부담 없는 표현 사용
5. 절대 경쟁이나 비교 언급 금지

평가 기준:
- 최근 포스팅 빈도 (많을수록 좋음)
- 게시물 수가 3개 이상: 70-85점
- 게시물 수가 1-2개: 60-70점
- 게시물 없음: 50-60점 (그래도 격려!)

status 지정:
- 85점 이상: excellent
- 70-84점: good
- 60-69점: fair
- 60점 미만: needs_improvement

motivationalMessage 작성 가이드:
- "오늘 한 게시물로 갓생에 더 가까이!" 같은 톤
- 절대 부담 주지 말 것
- 간결하게 1-2문장

insights 작성:
- 최대 3개의 짧은 조언
- 각 조언은 구체적이고 실행 가능해야 함
- "해보세요", "시도해 보세요" 같은 부드러운 표현 사용`
            });

            const prompt = `이 데이터를 분석해서 점수와 조언을 써줘. 최근 게시물 개수: ${postCount}개

${blogContext}

JSON 형식으로 답변해:
- score: 0-100 사이 숫자
- status: excellent/good/fair/needs_improvement
- motivationalMessage: 짧고 격려하는 메시지
- insights: 최대 3개의 실용적 조언 배열`;

            console.log('[BlogScoreService] Gemini prompt:', prompt);
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            console.log('[BlogScoreService] Gemini raw response:', text);
            const data = JSON.parse(text);

            return {
                score: Math.max(50, Math.min(100, data.score || 70)), // Clamp between 50-100
                status: data.status || 'good',
                motivationalMessage: data.motivationalMessage || '오늘도 화이팅!',
                insights: data.insights || []
            };
        } catch (error) {
            console.error('[BlogScoreService] Gemini analysis failed:', error);
            return this.getFallbackAnalysis();
        }
    },

    /**
     * Fallback analysis when services are unavailable
     */
    getFallbackAnalysis(): Omit<BlogScoreAnalysis, 'lastUpdated'> {
        return {
            score: 75,
            status: 'good',
            motivationalMessage: '오늘 한 게시물이면 충분해요! 😊',
            insights: [
                '꾸준함이 가장 중요해요',
                '주 2-3회 포스팅을 목표로 해보세요',
                '독자와 소통하는 글을 작성해 보세요'
            ]
        };
    },

    /**
     * Get status emoji for UI
     */
    getStatusEmoji(status: BlogScoreAnalysis['status']): string {
        const emojiMap: Record<BlogScoreAnalysis['status'], string> = {
            excellent: '🎉',
            good: '😊',
            fair: '💪',
            needs_improvement: '🌱'
        };
        return emojiMap[status] || '😊';
    },

    /**
     * Get status label in Korean
     */
    getStatusLabel(status: BlogScoreAnalysis['status']): string {
        const labelMap: Record<BlogScoreAnalysis['status'], string> = {
            excellent: '최고예요',
            good: '성장중',
            fair: '노력중',
            needs_improvement: '시작 단계'
        };
        return labelMap[status] || '성장중';
    }
};
