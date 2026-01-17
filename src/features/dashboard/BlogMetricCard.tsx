import React, { useEffect, useMemo, useState } from 'react';
import { useSlotStore } from '../../store/useSlotStore';
import { useBlogMetricStore } from '../../store/useBlogMetricStore';
import { useCompetitorStore } from '../../store/useCompetitorStore';
import { BarChart, TrendingUp, Users, MessageCircle, Heart, ArrowUpRight, RefreshCw, Search, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export const BlogMetricCard: React.FC = () => {
    const { slots, activeSlotId } = useSlotStore();
    const { getLatestMetric, getMetrics, generateMockData } = useBlogMetricStore();
    const { currentAnalysis, coaching, isAnalyzing, error, analyzeCompetitors } = useCompetitorStore();

    const [keyword, setKeyword] = useState('');
    const [showAnalysis, setShowAnalysis] = useState(false);

    const activeSlot = useMemo(() =>
        slots.find(s => s.slotId === activeSlotId),
        [slots, activeSlotId]
    );

    const currentBlogId = activeSlot?.naverBlogId;

    // currentAnalysis가 있으면 자동으로 분석 창이 열리도록 함
    const isAnalysisSectionVisible = showAnalysis || !!currentAnalysis;

    useEffect(() => {
        if (currentBlogId) {
            const metrics = getMetrics(currentBlogId);
            if (metrics.length === 0) {
                generateMockData(currentBlogId);
            }
        }
    }, [currentBlogId, getMetrics, generateMockData]);

    const latestMetric = useMemo(() => {
        if (!currentBlogId) return null;
        return getLatestMetric(currentBlogId);
    }, [currentBlogId, getLatestMetric]);

    const metricsHistory = useMemo(() => {
        if (!currentBlogId) return [];
        return getMetrics(currentBlogId);
    }, [currentBlogId, getMetrics]);

    // 경쟁사 분석 실행
    const handleAnalyze = async () => {
        if (!keyword.trim()) {
            alert('키워드를 입력해주세요.');
            return;
        }

        try {
            // 아직 작성 전이므로 0으로 초기화 (작성하면서 점수가 올라감)
            const myContent = {
                wordCount: 0,
                imageCount: 0,
                hasVideo: false,
                keywordFrequency: 0
            };

            await analyzeCompetitors(keyword, myContent);
            setShowAnalysis(true);
        } catch (error) {
            // Store에서 에러 처리함
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-blue-500';
        if (score >= 50) return 'text-orange-500';
        return 'text-red-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-blue-500';
        if (score >= 50) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/30';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
            case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
        }
    };

    if (!activeSlot || !currentBlogId) {
        return (
            <div className="glass-card p-8 flex flex-col items-center justify-center space-y-4 text-center h-full min-h-[300px]">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
                    <BarChart className="text-gray-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-300">블로그 지수 분석</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                    상단 메뉴에서 블로그 슬롯을 선택하면<br />
                    해당 계정의 상세 지표가 이곳에 표시됩니다.
                </p>
            </div>
        );
    }

    const renderTrendGraph = () => {
        if (metricsHistory.length === 0) return null;

        return (
            <div className="flex items-end justify-between h-24 gap-1 mt-4 px-2">
                {metricsHistory.map((metric, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                        <div
                            className={`w-full rounded-t-sm transition-all duration-500 ${getScoreBg(metric.score)} opacity-80 hover:opacity-100`}
                            style={{ height: `${(metric.score / 100) * 100}%` }}
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <TrendingUp className="text-orange-500" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">블로그 운영 지수</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                            <span>@{currentBlogId}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400">
                                {activeSlot.slotName}
                            </span>
                        </div>
                    </div>
                </div>

                {latestMetric && (
                    <div className={`text-3xl font-black ${getScoreColor(latestMetric.score)}`}>
                        {latestMetric.score}
                        <span className="text-xs text-gray-600 font-bold ml-1 align-baseline">/100</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                {/* Metrics Grid */}
                {latestMetric && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                            <Users size={16} className="mx-auto mb-1 text-blue-400" />
                            <span className="block text-xl font-bold text-white">{latestMetric.views.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Views</span>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                            <Heart size={16} className="mx-auto mb-1 text-pink-400" />
                            <span className="block text-xl font-bold text-white">{latestMetric.likes.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Likes</span>
                        </div>
                        <div className="bg-black/20 rounded-lg p-3 text-center border border-white/5">
                            <MessageCircle size={16} className="mx-auto mb-1 text-green-400" />
                            <span className="block text-xl font-bold text-white">{latestMetric.comments.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Comments</span>
                        </div>
                    </div>
                )}

                <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">일간 점수 추이 (7 Days)</span>
                        <button
                            onClick={() => currentBlogId && generateMockData(currentBlogId)}
                            className="text-gray-600 hover:text-white transition-colors"
                        >
                            <RefreshCw size={12} />
                        </button>
                    </div>
                    {renderTrendGraph()}
                </div>

                {/* [NEW] 경쟁사 분석 섹션 */}
                <div className="bg-brand-primary/10 rounded-xl p-4 border border-brand-primary/30">
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary mb-3 flex items-center gap-2">
                        <TrendingUp size={14} />
                        1위 탈환 AI 분석
                    </h4>

                    {/* 키워드 입력 */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="예: 김포 교통사고 한의원"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-brand-primary transition-all outline-none"
                            disabled={isAnalyzing}
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="px-4 py-2 bg-brand-primary text-black font-bold rounded-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="hidden sm:inline">분석중...</span>
                                </>
                            ) : (
                                <>
                                    <Search size={16} />
                                    <span className="hidden sm:inline">분석 시작</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* 에러 메시지 표시 */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-xs text-red-200 flex items-start gap-2">
                            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-red-500" />
                            <div>
                                <span className="font-bold block text-red-500 mb-1">분석 실패</span>
                                {error}
                                <div className="mt-2 text-[10px] text-red-400 opacity-70">
                                    * 네이버 API 호출 횟수가 초과되었거나, 일시적인 네트워크 오류일 수 있습니다. 잠시 후 다시 시도해주세요.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 분석 결과 */}
                    {isAnalysisSectionVisible && coaching && currentAnalysis && (
                        <div className="space-y-3">
                            {/* 점수 비교 */}
                            <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">내 점수</span>
                                    <span className={`text-2xl font-black ${getScoreColor(coaching.overallScore)}`}>
                                        {coaching.overallScore}점
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">상위권 평균</span>
                                    <span className="text-2xl font-black text-blue-500">
                                        {coaching.targetScore}점
                                    </span>
                                </div>
                                <div className="mt-2 text-[10px] text-gray-500 text-center">
                                    {coaching.targetScore - coaching.overallScore}점 차이
                                </div>
                            </div>

                            {/* AI 코칭 체크리스트 */}
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    AI 코칭 체크리스트
                                </h5>
                                {coaching.recommendations.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border ${getPriorityColor(item.priority)}`}
                                    >
                                        <div className="flex items-start gap-2 mb-1">
                                            {item.priority === 'critical' ? (
                                                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                            ) : (
                                                <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <div className="text-[10px] font-black uppercase tracking-wider mb-1">
                                                    {item.category}
                                                </div>
                                                <div className="text-xs text-gray-300 mb-1">
                                                    {item.issue}
                                                </div>
                                                <div className="text-xs font-bold">
                                                    ✅ {item.action}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 상위 블로그 미리보기 */}
                            <div className="space-y-1">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    상위 1~3위 블로그
                                </h5>
                                {currentAnalysis.topBlogs.slice(0, 3).map((blog, idx) => (
                                    <a
                                        key={idx}
                                        href={blog.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block p-2 rounded-lg bg-black/20 border border-white/10 hover:border-brand-primary/30 transition-all text-xs"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-400 truncate flex-1">
                                                {idx + 1}위: {blog.title}
                                            </span>
                                            <span className="text-[10px] text-gray-600 ml-2">
                                                {blog.wordCount}자 · {blog.imageCount}장
                                            </span>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 블로그 글쓰기 바로가기 */}
                <a
                    href={`https://blog.naver.com/${currentBlogId}/logwrite`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 rounded-xl bg-gray-800 text-white font-bold uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-2 group/btn"
                >
                    <span>블로그 글쓰기 바로가기</span>
                    <ArrowUpRight size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </a>
            </div>
        </div>
    );
};
