import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, TrendingUp, Sparkles } from 'lucide-react';
import { useBlogScoreStore } from '../../store/useBlogScoreStore';
import { blogScoreService } from '../../services/blogScoreService';
import { useProfileStore } from '../../store/useProfileStore';
import { useSlotStore } from '../../store/useSlotStore';

/**
 * BlogMotivation - Lightweight motivation system
 * 
 * Design Principles:
 * 1. NON-INTRUSIVE: No popups, no forced interactions
 * 2. ENCOURAGING: Always positive, never stressful
 * 3. ACTIONABLE: Every message connects to writing behavior
 * 4. LIGHTWEIGHT: Cached data, minimal updates (1x per day)
 * 5. REMOVABLE: App works perfectly without this feature
 */
export const BlogMotivation: React.FC = () => {
    const { selectedBlogId } = useProfileStore();
    const { activeSlotId, getSlotById } = useSlotStore();
    const { lastScore, updateScore } = useBlogScoreStore();

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [manualBlogId, setManualBlogId] = useState('');

    // Get blog ID from active slot or profile
    const activeSlot = activeSlotId ? getSlotById(activeSlotId) : null;
    const defaultBlogId = activeSlot?.naverBlogId || selectedBlogId || '';
    const blogId = manualBlogId || defaultBlogId;

    const handleAnalyze = async () => {
        const currentBlogId = manualBlogId || defaultBlogId;

        if (!currentBlogId) {
            alert('블로그 ID를 먼저 설정해 주세요.');
            return;
        }

        alert('블로그 분석을 시작합니다. 잠시만 기다려 주세요!');
        setIsAnalyzing(true);
        try {
            console.log('[BlogMotivation] Starting analysis for:', currentBlogId);
            const analysis = await blogScoreService.analyzeBlog(currentBlogId);
            updateScore(analysis);
            console.log('[BlogMotivation] Analysis complete:', analysis);
        } catch (error) {
            console.error('[BlogMotivation] Analysis failed:', error);
            alert('분석 중 오류가 발생했습니다. 콘솔을 확인해 주세요.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const emoji = lastScore ? blogScoreService.getStatusEmoji(lastScore.status) : '😊';
    const statusLabel = lastScore ? blogScoreService.getStatusLabel(lastScore.status) : '분석 대기중';

    return (
        <div className="space-y-6 pb-20">
            {/* Lightweight Home Screen Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8 relative overflow-hidden"
            >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                                <Activity className="text-brand-primary" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tight">
                                    Blog Motivation
                                </h2>
                                <p className="text-xs text-gray-500 font-medium">
                                    가벼운 동기부여 시스템
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Blog ID Search Input */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={manualBlogId}
                                    onChange={(e) => setManualBlogId(e.target.value)}
                                    placeholder={defaultBlogId || "블로그 ID 입력 (예: dodam_clinic)"}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && manualBlogId) {
                                            handleAnalyze();
                                        }
                                    }}
                                    className="w-64 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-brand-primary outline-none transition-all"
                                />
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !blogId}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-black transition-all text-sm font-bold border border-brand-primary/20 disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
                                {isAnalyzing ? '분석중...' : '검색'}
                            </button>
                        </div>
                    </div>

                    {/* Simple Status Display */}
                    {lastScore ? (
                        <div className="flex items-center gap-6">
                            <div className="text-center">
                                <div className="text-6xl mb-2">{emoji}</div>
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    {statusLabel}
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                <p className="text-lg font-medium text-white leading-relaxed">
                                    {lastScore.motivationalMessage}
                                </p>

                                {/* Simple Progress Bar (not a chart!) */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-gray-500">블로그 활력도</span>
                                        <span className="text-brand-primary">{lastScore.score}점</span>
                                    </div>
                                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${lastScore.score}%` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                            className="h-full bg-gradient-to-r from-brand-primary to-purple-500 rounded-full"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-xs text-gray-500 hover:text-brand-primary transition-colors font-medium flex items-center gap-1"
                                >
                                    <TrendingUp size={12} />
                                    {showDetails ? '간단히 보기' : '자세히 보기'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Sparkles size={48} className="mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-500 font-medium">
                                {blogId ? '블로그 점수를 분석해 보세요!' : '블로그 ID를 설정해 주세요.'}
                            </p>
                            {blogId && (
                                <button
                                    onClick={handleAnalyze}
                                    className="mt-4 px-6 py-3 bg-brand-primary text-black font-bold rounded-lg hover:shadow-neon transition-all"
                                >
                                    분석 시작하기
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Hidden Deep Dive - Only shown when explicitly requested */}
            {showDetails && lastScore && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass-card p-8 space-y-6"
                >
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <TrendingUp className="text-brand-primary" />
                        실용적 조언
                    </h3>

                    <div className="space-y-3">
                        {lastScore.insights.map((insight, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/5"
                            >
                                <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-brand-primary font-bold text-xs">{index + 1}</span>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
                            </div>
                        ))}
                    </div>

                    <p className="text-[10px] text-gray-600 text-center mt-6">
                        * 마지막 업데이트: {new Date(lastScore.lastUpdated).toLocaleString('ko-KR')}
                        <br />* 점수는 하루에 한 번 자동으로 갱신됩니다.
                    </p>
                </motion.div>
            )}

            {/* Encouragement Footer - Always visible */}
            <div className="text-center space-y-2">
                <p className="text-sm text-gray-500 font-medium">
                    💡 오늘 한 게시물로 갓생에 더 가까이 다가갈 수 있습니다!
                </p>
                <p className="text-[10px] text-gray-600">
                    이 기능은 글쓰기 동기부여를 위한 참고용이며, 절대적인 지표가 아닙니다.
                </p>
            </div>
        </div>
    );
};
