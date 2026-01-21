import React, { useEffect, useState } from 'react';
import { Search, Activity, RefreshCw, AlertTriangle, CheckCircle, XCircle, ClipboardList, Swords, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useProfileStore } from '../../store/useProfileStore';
import { useSlotStore } from '../../store/useSlotStore';
import { useBlogDiagnosisStore } from '../../store/useBlogDiagnosisStore';
import { blogDiagnosisService } from '../../services/blogDiagnosisService';
import { motion, AnimatePresence } from 'framer-motion';

export const DashboardDiagnosisCard: React.FC = () => {
    const { selectedBlogId } = useProfileStore();
    const { activeSlotId, getSlotById } = useSlotStore();
    const { getTodaySnapshot, addSnapshot } = useBlogDiagnosisStore();

    // Local State
    const [inputId, setInputId] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [mySnapshot, setMySnapshot] = useState<any>(null);
    const [searchSnapshot, setSearchSnapshot] = useState<any>(null);
    const [comparison, setComparison] = useState<any>(null);

    // 1. Auto-Sync with Active Slot (My Blog)
    const activeSlot = activeSlotId ? getSlotById(activeSlotId) : null;
    const myBlogId = activeSlot?.naverBlogId || selectedBlogId;

    // 2. Fetch My Snapshot
    useEffect(() => {
        if (!myBlogId) {
            setMySnapshot(null);
            return;
        }
        const checkMyHealth = async () => {
            const cached = getTodaySnapshot(myBlogId);
            if (cached) {
                setMySnapshot(cached);
            } else if (activeSlot?.naverBlogId) {
                // Background Silent Run
                try {
                    const metrics = await blogDiagnosisService.fetchBlogStats(myBlogId);
                    const result = blogDiagnosisService.analyzeBlogHealth(metrics);
                    const newSnap = createSnapshot(myBlogId, result);
                    addSnapshot(newSnap);
                    setMySnapshot(newSnap);
                } catch (e) {
                    console.error("Silent Run Error", e);
                }
            }
        };
        checkMyHealth();
    }, [myBlogId, getTodaySnapshot, addSnapshot, activeSlot?.naverBlogId]);

    // 3. Search Handler (Competitor)
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputId.trim()) return;

        setIsAnalyzing(true);
        setSearchSnapshot(null);
        setComparison(null);

        try {
            // Check cache or fetch
            let snap = getTodaySnapshot(inputId);
            if (!snap) {
                const metrics = await blogDiagnosisService.fetchBlogStats(inputId);
                const result = blogDiagnosisService.analyzeBlogHealth(metrics);
                snap = createSnapshot(inputId, result);
                addSnapshot(snap);
            }
            setSearchSnapshot(snap);

            // Compare if I have my blog
            if (mySnapshot) {
                const compResult = blogDiagnosisService.compareBlogs(mySnapshot.metrics, snap.metrics);
                setComparison(compResult);
            }

        } catch (e) {
            console.error("Search Error", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const createSnapshot = (id: string, result: any) => ({
        id: Date.now().toString(),
        blogId: id,
        date: new Date().toISOString(),
        status: result.status,
        score: result.status === 'GREEN' ? 92 : result.status === 'YELLOW' ? 68 : 45,
        metrics: result.metrics,
        facts: result.facts,
        solution: result.solution,
        jennyComment: result.jennyComment
    });

    // Helper: Render Logic
    const renderContent = () => {
        if (isAnalyzing) {
            return (
                <div className="flex items-center gap-4 bg-white/5 p-6 rounded-xl border border-white/10 animate-pulse">
                    <RefreshCw className="animate-spin text-brand-primary" size={24} />
                    <div className="text-sm font-bold text-gray-300">경쟁사 블로그 정밀 분석 중...</div>
                </div>
            );
        }

        // MODE 1: Comparison (My Blog vs Search)
        if (mySnapshot && searchSnapshot && comparison) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* My Blog */}
                    <div className="bg-black/40 border border-white/10 p-4 rounded-xl flex flex-col items-center justify-center opacity-70">
                        <div className="text-xs text-gray-500 mb-1">나의 블로그</div>
                        <div className="font-bold text-lg mb-2 truncate max-w-full">{mySnapshot.blogId}</div>
                        <div className="text-3xl font-black text-white">{mySnapshot.score}</div>
                    </div>

                    {/* VS Center */}
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Swords className="text-brand-primary" size={32} />
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${comparison.scoreGap > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            }`}>
                            {comparison.scoreGap > 0 ? `+${comparison.scoreGap}점 우위` : `${comparison.scoreGap}점 열세`}
                        </span>
                    </div>

                    {/* Competitor */}
                    <div className="bg-white/5 border border-brand-primary/50 p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
                        <div className="text-xs text-brand-primary mb-1">경쟁사 (Target)</div>
                        <div className="font-bold text-lg mb-2 truncate max-w-full">{searchSnapshot.blogId}</div>
                        <div className="text-3xl font-black text-white">{searchSnapshot.score}</div>
                    </div>

                    {/* Insights Row */}
                    <div className="col-span-full bg-white/5 rounded-xl p-4 mt-2">
                        <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                            <Activity size={14} className="text-gray-400" /> 분석 결과
                            <span className="text-[10px] lg:text-xs font-normal text-gray-500">
                                ({comparison.verdict === 'EASY' ? '충분히 이길 수 있습니다!' : comparison.verdict === 'IMPOSSIBLE' ? '상대가 너무 강력합니다.' : '치열한 접전이 예상됩니다.'})
                            </span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <div className="text-green-500 font-bold mb-1 flex items-center gap-1"><TrendingUp size={12} /> 나의 강점</div>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    {comparison && comparison.pros && comparison.pros.length > 0 ? comparison.pros.map((p: string, i: number) => <li key={i}>{p}</li>) : <li>특이 강점 없음</li>}
                                </ul>
                            </div>
                            <div>
                                <div className="text-red-400 font-bold mb-1 flex items-center gap-1"><TrendingDown size={12} /> 나의 약점</div>
                                <ul className="list-disc list-inside text-gray-400 space-y-1">
                                    {comparison && comparison.cons && comparison.cons.length > 0 ? comparison.cons.map((c: string, i: number) => <li key={i}>{c}</li>) : <li>약점 발견되지 않음</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // MODE 2: Single Result (My Blog OR Search)
        const target = searchSnapshot || mySnapshot;
        if (target) {
            return (
                <div className="space-y-4">
                    <div className={`relative overflow-hidden rounded-xl border p-4 flex items-center justify-between ${target.status === 'GREEN' ? 'bg-green-500/10 border-green-500/30' :
                        target.status === 'YELLOW' ? 'bg-yellow-500/10 border-yellow-500/30' :
                            'bg-red-500/10 border-red-500/30'
                        }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${target.status === 'GREEN' ? 'bg-green-500 text-black' :
                                target.status === 'YELLOW' ? 'bg-yellow-500 text-black' :
                                    'bg-red-500 text-white'
                                }`}>
                                {target.status === 'GREEN' ? <CheckCircle size={24} /> :
                                    target.status === 'RED' ? <XCircle size={24} /> :
                                        <AlertTriangle size={24} />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`font-black text-lg ${target.status === 'GREEN' ? 'text-green-500' :
                                        target.status === 'YELLOW' ? 'text-yellow-500' :
                                            'text-red-500'
                                        }`}>
                                        {target.status === 'GREEN' ? '최적화 (Stable)' :
                                            target.status === 'YELLOW' ? '주의 (Warning)' :
                                                '위험 (Danger)'}
                                    </span>
                                    <span className="text-xs text-gray-400 font-normal">| {target.blogId}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-2xl font-black italic">{target.score}</div>
                    </div>

                    {/* Solutions (Action Items) */}
                    {target.solution && target.solution.length > 0 && (
                        <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-brand-primary mb-3">
                                <ClipboardList size={14} /> {target === mySnapshot ? '오늘의 처방 (Action Items)' : '경쟁사 대응 전략'}
                            </h4>
                            <ul className="space-y-2">
                                {target.solution.slice(0, 3).map((item: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                                        <span className="text-brand-primary mt-0.5">•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                <p className="text-gray-500 text-sm">등록된 슬롯이 없거나 진단 기록이 없습니다.</p>
            </div>
        );
    };

    return (
        <div className="glass-card p-6 relative overflow-hidden group min-h-[250px] flex flex-col gap-6">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Activity size={120} />
            </div>

            {/* Header + Search */}
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                        BLOG CHECKUP
                    </h3>
                    <p className="text-gray-400 text-sm">
                        {mySnapshot && searchSnapshot ? "경쟁사 비교 분석 모드" : "블로그 정밀 진단 시스템"}
                    </p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:max-w-xs">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input
                            type="text"
                            value={inputId}
                            onChange={(e) => setInputId(e.target.value)}
                            placeholder={mySnapshot ? "경쟁사 ID 입력 후 비교" : "네이버 ID 입력"}
                            className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-brand-primary focus:outline-none transition-colors"
                        />
                    </div>
                    <button type="submit" className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
                        <ArrowRight size={16} />
                    </button>
                </form>
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mySnapshot && searchSnapshot ? 'multi' : 'single'}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
