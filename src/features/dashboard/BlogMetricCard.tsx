import React, { useEffect, useMemo } from 'react';
import { useProfileStore } from '../../store/useProfileStore';
import { useBlogMetricStore } from '../../store/useBlogMetricStore';
import { BarChart, TrendingUp, Users, MessageCircle, Heart, ArrowUpRight, RefreshCw } from 'lucide-react';

export const BlogMetricCard: React.FC = () => {
    const { blogAccounts = [], selectedBlogId, selectBlogAccount } = useProfileStore();
    const { getLatestMetric, getMetrics, generateMockData } = useBlogMetricStore();

    // 선택된 블로그가 없으면 첫 번째 계정 선택 시도
    useEffect(() => {
        if (!selectedBlogId && blogAccounts && blogAccounts.length > 0) {
            selectBlogAccount(blogAccounts[0]);
        }
    }, [selectedBlogId, blogAccounts, selectBlogAccount]);

    // 데이터가 없으면 Mock Data 생성 (데모용)
    useEffect(() => {
        if (selectedBlogId) {
            const metrics = getMetrics(selectedBlogId);
            if (metrics.length === 0) {
                generateMockData(selectedBlogId);
            }
        }
    }, [selectedBlogId, getMetrics, generateMockData]);

    const latestMetric = useMemo(() => {
        if (!selectedBlogId) return null;
        return getLatestMetric(selectedBlogId);
    }, [selectedBlogId, getLatestMetric]);

    const metricsHistory = useMemo(() => {
        if (!selectedBlogId) return [];
        return getMetrics(selectedBlogId);
    }, [selectedBlogId, getMetrics]);

    // 점수별 색상 계산
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

    if (blogAccounts.length === 0) {
        return (
            <div className="glass-card p-8 flex flex-col items-center justify-center space-y-4 text-center h-full min-h-[300px]">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-2">
                    <BarChart className="text-gray-500" size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-300">블로그 지수 분석</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                    프로파일 설정에서 네이버 블로그 ID를 등록하면<br />
                    상세한 운영 지표를 확인할 수 있습니다.
                </p>
            </div>
        );
    }

    // 트렌드 그래프 (간단한 Bar Chart)
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
                        {/* <span className="text-[9px] text-gray-600">{metric.date.slice(5)}</span> */}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="glass-card p-6 h-full flex flex-col relative overflow-hidden group">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <TrendingUp className="text-orange-500" size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">블로그 운영 지수</h3>
                        <div className="relative group/dropdown">
                            <select
                                value={selectedBlogId || ''}
                                onChange={(e) => selectBlogAccount(e.target.value)}
                                className="bg-transparent text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer outline-none hover:text-white transition-colors appearance-none pr-4"
                            >
                                {blogAccounts.map(id => (
                                    <option key={id} value={id} className="bg-gray-900 text-white">
                                        @{id}
                                    </option>
                                ))}
                            </select>
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none text-gray-600">▼</span>
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

            {/* Metrics Grid */}
            {latestMetric ? (
                <div className="flex-1 space-y-6">
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

                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">일간 점수 추이 (7 Days)</span>
                            <button
                                onClick={() => selectedBlogId && generateMockData(selectedBlogId)}
                                className="text-gray-600 hover:text-white transition-colors"
                            >
                                <RefreshCw size={12} />
                            </button>
                        </div>
                        {renderTrendGraph()}
                    </div>

                    <a
                        href={`https://blog.naver.com/${selectedBlogId}/logwrite`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-4 rounded-xl bg-gray-800 text-white font-bold uppercase tracking-widest hover:bg-green-600 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                    >
                        <span>블로그 글쓰기 바로가기</span>
                        <ArrowUpRight size={16} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </a>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                    데이터를 불러오는 중입니다...
                </div>
            )}
        </div>
    );
};
