import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, XCircle, Search, Swords, TrendingUp, TrendingDown } from 'lucide-react';
import { useBlogDiagnosisStore } from '../../store/useBlogDiagnosisStore';
import type { DiagnosisSnapshot } from '../../store/useBlogDiagnosisStore';
import { blogDiagnosisService } from '../../services/blogDiagnosisService';
import { useProfileStore } from '../../store/useProfileStore';
import { useSlotStore } from '../../store/useSlotStore';

export const BlogHealthCheck: React.FC = () => {
    const { selectedBlogId, selectBlogAccount } = useProfileStore();
    const { activeSlotId, getSlotById } = useSlotStore();
    const { addSnapshot, getLatestSnapshot, getHistory } = useBlogDiagnosisStore();

    const [isLoading, setIsLoading] = useState(false);

    // State for Diagnosis
    const [targetSnapshot, setTargetSnapshot] = useState<DiagnosisSnapshot | null>(null);
    const [mySnapshot, setMySnapshot] = useState<DiagnosisSnapshot | null>(null);
    const [, setHistory] = useState<DiagnosisSnapshot[]>([]);

    // Comparison Result
    const [comparison, setComparison] = useState<any>(null);

    // Identify Identity
    const activeSlot = activeSlotId ? getSlotById(activeSlotId) : null;
    const myBlogId = activeSlot?.naverBlogId;
    const isComparisonMode = !!(selectedBlogId && myBlogId && selectedBlogId !== myBlogId);

    // Load Data Effect
    useEffect(() => {
        if (selectedBlogId) {
            const snap = getLatestSnapshot(selectedBlogId);
            setTargetSnapshot(snap);
            setHistory(getHistory(selectedBlogId));
        }

        if (myBlogId) {
            const mySnap = getLatestSnapshot(myBlogId);
            setMySnapshot(mySnap);
        }
    }, [selectedBlogId, myBlogId, getLatestSnapshot, getHistory]);

    // Comparison Logic Effect
    useEffect(() => {
        if (isComparisonMode && targetSnapshot && mySnapshot) {
            const comp = blogDiagnosisService.compareBlogs(mySnapshot.metrics, targetSnapshot.metrics);
            setComparison(comp);
        } else {
            setComparison(null);
        }
    }, [isComparisonMode, targetSnapshot, mySnapshot]);

    const runDiagnosis = async () => {
        if (!selectedBlogId) return alert('블로그 ID가 설정되지 않았습니다.');
        setIsLoading(true);

        try {
            await new Promise(r => setTimeout(r, 2000)); // Sim
            const stats = await blogDiagnosisService.fetchBlogStats(selectedBlogId);
            const result = blogDiagnosisService.analyzeBlogHealth(stats);

            const newSnapshot = {
                blogId: selectedBlogId,
                status: result.status,
                metrics: result.metrics,
                jennyComment: result.jennyComment,
                id: Date.now().toString(),
                date: new Date().toISOString(),
                score: 80,
                facts: [],
                solution: []
            };

            addSnapshot({
                blogId: selectedBlogId,
                status: result.status,
                metrics: result.metrics,
                jennyComment: result.jennyComment,
                score: 80,
                facts: [],
                solution: []
            });

            // Update Local
            setTargetSnapshot(newSnapshot as DiagnosisSnapshot);
            setHistory(getHistory(selectedBlogId));

            // Also refresh 'My Snapshot' if I am analyzing myself
            if (selectedBlogId === myBlogId) {
                setMySnapshot(newSnapshot as DiagnosisSnapshot);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'RED': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'YELLOW': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'GREEN': return 'text-green-500 bg-green-500/10 border-green-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white italic tracking-tight flex items-center gap-2">
                        {isComparisonMode ? 'COMPETITOR ANALYSIS' : "JENNY'S CHECKUP"}
                        <Activity className="text-brand-primary" />
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {isComparisonMode ? (
                            <span>
                                <span className="text-white font-bold">{myBlogId}</span> (나) <span className="mx-2 text-xs">VS</span> <span className="text-brand-primary font-bold">{selectedBlogId}</span> (경쟁사)
                            </span>
                        ) : (
                            <span>현재 진단 중: <span className="text-brand-primary font-bold bg-brand-primary/10 px-2 py-0.5 rounded">{selectedBlogId || '없음'}</span></span>
                        )}
                    </p>
                </div>

                <div className="flex gap-2">
                    <input
                        value={selectedBlogId || ''}
                        onChange={(e) => selectBlogAccount(e.target.value)}
                        placeholder="ID 입력"
                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-brand-primary focus:outline-none w-40"
                    />
                    <button
                        onClick={runDiagnosis}
                        disabled={isLoading || !selectedBlogId}
                        className="px-6 py-2 bg-white/5 border border-white/10 hover:bg-brand-primary hover:text-black hover:border-brand-primary rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Search className="animate-spin" size={16} /> : <Search size={16} />}
                        {isLoading ? 'ANALYZING...' : 'RUN'}
                    </button>
                </div>
            </div>

            {/* Comparison Mode UI */}
            {isComparisonMode && comparison && mySnapshot && targetSnapshot ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {/* Scoreboard */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Me */}
                        <div className="glass-card p-6 flex flex-col items-center justify-center border-white/5 bg-white/[0.02]">
                            <div className="text-xs text-gray-500 mb-2 uppercase tracking-widest">My Blog</div>
                            <div className="text-4xl font-black">{mySnapshot.status === 'GREEN' ? 92 : mySnapshot.status === 'YELLOW' ? 68 : 45}</div>
                            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(mySnapshot.status)}`}>
                                {mySnapshot.status}
                            </div>
                        </div>

                        {/* VS */}
                        <div className="flex flex-col items-center justify-center">
                            <Swords size={48} className="text-brand-primary mb-4" />
                            <div className={`text-lg font-black ${comparison.scoreGap > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {comparison.scoreGap > 0 ? `+${comparison.scoreGap}점` : `${comparison.scoreGap}점`}
                            </div>
                            <div className="text-xs text-gray-500">{comparison.scoreGap > 0 ? "우세" : "열세"}</div>
                        </div>

                        {/* Them */}
                        <div className="glass-card p-6 flex flex-col items-center justify-center border-brand-primary/30 bg-brand-primary/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 bg-brand-primary text-black text-[10px] font-bold">TARGET</div>
                            <div className="text-xs text-brand-primary mb-2 uppercase tracking-widest">Competitor</div>
                            <div className="text-4xl font-black text-white">{targetSnapshot.status === 'GREEN' ? 92 : targetSnapshot.status === 'YELLOW' ? 68 : 45}</div>
                            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(targetSnapshot.status)}`}>
                                {targetSnapshot.status}
                            </div>
                        </div>
                    </div>

                    {/* Deep Analysis */}
                    <div className="glass-card p-8">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <Activity className="text-brand-primary" /> 전략 분석 리포트
                            <span className="text-xs font-normal text-gray-500 ml-2">
                                승률 예측: <span className={`font-bold ${comparison.verdict === 'EASY' ? 'text-green-500' : 'text-red-500'}`}>{comparison.verdict}</span>
                            </span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="flex items-center gap-2 text-green-500 font-bold mb-4 border-b border-green-500/20 pb-2">
                                    <TrendingUp size={16} /> 나의 공략 포인트 (강점)
                                </h4>
                                <ul className="space-y-3">
                                    {comparison.pros.length > 0 ? comparison.pros.map((p: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                            <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                            {p}
                                        </li>
                                    )) : <li className="text-gray-600 text-sm">상대에 비해 뚜렷한 강점이 부족합니다.</li>}
                                </ul>
                            </div>
                            <div>
                                <h4 className="flex items-center gap-2 text-red-500 font-bold mb-4 border-b border-red-500/20 pb-2">
                                    <TrendingDown size={16} /> 시급한 보완점 (약점)
                                </h4>
                                <ul className="space-y-3">
                                    {comparison.cons.length > 0 ? comparison.cons.map((c: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                                            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                                            {c}
                                        </li>
                                    )) : <li className="text-gray-600 text-sm">특별한 약점이 발견되지 않았습니다.</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                /* Standard Single Mode (User or Competitor Single) */
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className={`col-span-1 p-8 rounded-2xl border flex flex-col items-center justify-center text-center space-y-6 ${targetSnapshot ? getStatusColor(targetSnapshot.status) : 'border-white/10 bg-white/5'}`}>
                            {targetSnapshot ? (
                                <>
                                    <div className="relative">
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${targetSnapshot.status === 'RED' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : targetSnapshot.status === 'YELLOW' ? 'border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)]' : 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]'}`}
                                        >
                                            {targetSnapshot.status === 'RED' && <XCircle size={48} className="text-red-500" />}
                                            {targetSnapshot.status === 'YELLOW' && <AlertTriangle size={48} className="text-yellow-500" />}
                                            {targetSnapshot.status === 'GREEN' && <CheckCircle2 size={48} className="text-green-500" />}
                                        </motion.div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight mb-1">{targetSnapshot.status}</h3>
                                        <p className="text-xs font-bold opacity-70">진단일: {new Date(targetSnapshot.date).toLocaleDateString()}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-500">
                                    <Activity size={48} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm font-bold">진단 데이터를 불러오는 중...</p>
                                </div>
                            )}
                        </div>

                        <div className="col-span-2 p-8 rounded-2xl bg-[#1a1a1a] border border-white/10 relative overflow-hidden">
                            {targetSnapshot ? (
                                <div className="relative z-10 space-y-6">
                                    <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest">Jenny's Insight</h3>
                                    <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm leading-relaxed font-medium">
                                        "{targetSnapshot.jennyComment}"
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 bg-black/40 rounded-xl text-center">
                                            <span className="block text-xs text-gray-500 uppercase mb-1">Weekly Posts</span>
                                            <span className="text-xl font-bold text-white">{targetSnapshot.metrics.recentPostCount}</span>
                                        </div>
                                        <div className="p-4 bg-black/40 rounded-xl text-center">
                                            <span className="block text-xs text-gray-500 uppercase mb-1">Index Miss</span>
                                            <span className={`text-xl font-bold ${targetSnapshot.metrics.indexErrorRate > 20 ? 'text-red-500' : 'text-green-500'}`}>
                                                {targetSnapshot.metrics.indexErrorRate}%
                                            </span>
                                        </div>
                                        <div className="p-4 bg-black/40 rounded-xl text-center">
                                            <span className="block text-xs text-gray-500 uppercase mb-1">Keyword Exp</span>
                                            <span className="text-xl font-bold text-white">{targetSnapshot.metrics.keywordExposureRate}%</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-600">
                                    <p>데이터 대기 중...</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};
