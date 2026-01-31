import React, { useState } from 'react';
import { useKeywordStore } from '../../store/useKeywordStore';
import { useBrandStore } from '../../store/useBrandStore';
import { usePlannerStore } from '../../store/usePlannerStore';
import { Zap, Building2, Database, BarChart3, Diamond, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TodayAction } from '../dashboard/TodayAction';

// [나노바나나] 지수 전광판 상태 기반 색상 로직
const getIndexTheme = (score: number) => {
    if (score < 30) return { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'LOW INDEX' };
    if (score < 70) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'MID INDEX' };
    return { color: 'text-brand-primary', bg: 'bg-brand-primary/10', border: 'border-brand-primary/20', label: 'HIGH INDEX' };
};

export const MidnightScout: React.FC = () => {
    const brand = useBrandStore();
    const planner = usePlannerStore();
    const { keywords } = useKeywordStore();
    const [isScouting, setIsScouting] = useState(false);
    const [scoutProgress, setScoutProgress] = useState(0);

    const activeKeywords = keywords.filter(k => !k.isDeleted);
    const theme = getIndexTheme(brand.blogIndex);

    // 탐사 애니메이션 핸들러
    const handleStartScout = () => {
        setIsScouting(true);
        setScoutProgress(0);

        const interval = setInterval(() => {
            setScoutProgress((prev: number) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsScouting(false);
                    planner.setIsScouted(true);
                    return 100;
                }
                return prev + 2;
            });
        }, 30);
    };

    return (
        <div className="space-y-12 pb-20">
            {/* 오늘의 액션 카드 */}
            <TodayAction />

            {/* [Section 1] 통합 관제 센터 (Dashboard) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 메인 지수 전광판 */}
                <div className={`lg:col-span-2 glass-card p-6 relative overflow-hidden flex flex-col justify-center animate-in fade-in slide-in-from-top-4 duration-700 ${theme.bg} ${theme.border}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap size={100} className={theme.color} />
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full animate-ping ${theme.color.replace('text', 'bg')}`} />
                            <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${theme.color}`}>Real-time Monitoring</span>
                        </div>
                        <div className="flex items-end gap-4">
                            <h2 className="text-6xl font-black tracking-tighter italic leading-none">
                                {brand.blogIndex}<span className="text-xl ml-1 opacity-50">SCORE</span>
                            </h2>
                            <p className={`text-sm font-black uppercase tracking-tighter italic pb-1 ${theme.color}`}>{theme.label}</p>
                        </div>
                        <div className="flex gap-6 border-t border-white/5 pt-4">
                            <div className="space-y-0.5">
                                <p className="text-[8px] text-gray-500 font-bold uppercase">Visitors</p>
                                <p className="text-sm font-black">{brand.indicators.visitors.toLocaleString()}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[8px] text-gray-500 font-bold uppercase">Stay</p>
                                <p className="text-sm font-black">{brand.indicators.stayTime}s</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[8px] text-gray-500 font-bold uppercase">Rank</p>
                                <p className="text-sm font-black">{brand.indicators.rankingScore}%</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 브랜드 정보 카드 */}
                <div className="glass-card p-5 flex flex-col justify-between hover:bg-white/[0.05] transition-all group">
                    <div className="space-y-3">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-brand-primary/30 transition-colors">
                            <Building2 className="text-gray-400 group-hover:text-brand-primary" size={20} />
                        </div>
                        <div>
                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Master Brand</p>
                            <h3 className="font-black text-lg tracking-tighter truncate">{brand.clinicName || '나노바나나'}</h3>
                        </div>
                    </div>
                    <div className="space-y-1 mt-auto">
                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Global URL</p>
                        <p className="text-[10px] text-brand-primary font-medium truncate">{brand.blogUrl || 'not registered'}</p>
                    </div>
                </div>

                {/* 제니 엔진 상태 전광판 */}
                <div className="glass-card p-5 flex flex-col items-center justify-center text-center space-y-3 bg-brand-primary/5 border-brand-primary/20">
                    <div className="relative">
                        <Diamond className="text-brand-primary" size={32} />
                        <div className="absolute inset-0 bg-brand-primary blur-xl opacity-20 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black italic tracking-tighter uppercase neon-text">VIP BLACK</h3>
                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest leading-tight">Active Chameleon <br />Engine</p>
                    </div>
                </div>
            </div>

            {/* [Section 2] MidnightScout 탐사 비주얼 */}
            <section className="relative glass-card p-16 overflow-hidden flex flex-col items-center text-center space-y-8 bg-gradient-to-br from-white/[0.03] to-transparent border-dashed border-white/10 group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

                <AnimatePresence mode="wait">
                    {isScouting ? (
                        <motion.div key="scouting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="w-full max-w-xl space-y-8 relative z-10">
                            <div className="space-y-2">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full mx-auto" />
                                <h4 className="text-2xl font-black italic tracking-tighter uppercase">Scouting...</h4>
                            </div>
                            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <motion.div className="bg-brand-primary h-full shadow-neon" initial={{ width: 0 }} animate={{ width: `${scoutProgress}%` }} />
                            </div>
                            <p className="text-4xl font-black italic opacity-20 tracking-tighter">{scoutProgress}%</p>
                        </motion.div>
                    ) : (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary font-black text-[9px] uppercase tracking-[0.3em] mb-2">
                                    <Sparkles size={14} /> Intelligent Deep Scout
                                </div>
                                <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none italic uppercase">
                                    Midnight <br /> <span className="neon-text">Scout</span> Pro
                                </h2>
                                <p className="text-gray-500 text-sm max-w-xl mx-auto font-medium leading-relaxed">
                                    블로그 지수와 경쟁 데이터를 정밀 분석합니다. <br />
                                    최적의 '카멜레온 전략'을 제니가 수립합니다.
                                </p>
                            </div>
                            <button
                                onClick={handleStartScout}
                                className="bg-brand-primary text-black px-10 py-5 rounded-xl font-black flex items-center gap-3 transition-all hover:shadow-neon hover:scale-105 mx-auto uppercase italic group active:scale-95 text-sm"
                            >
                                <Zap className="group-hover:rotate-12 transition-transform" size={20} />
                                Start Neural Deep Scout
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* [Section 3] 탐사 결과 요약 (Keywords) */}
            <section className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3 text-brand-primary">
                        <BarChart3 size={24} />
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Intelligence <br /> Reports</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeKeywords.slice(0, 4).map((keyword: any) => (
                        <div key={keyword.id} className="glass-card p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-white/5 group">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${keyword.grade === '다이아' ? 'bg-brand-primary/10 text-brand-primary shadow-neon-sm' : 'bg-white/5 text-gray-500'}`}>
                                    <Database size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm truncate max-w-[100px]">{keyword.term}</h3>
                                    <p className="text-[8px] text-gray-600 font-black uppercase mt-0.5 tracking-widest">Ratio: {keyword.ratio}</p>
                                </div>
                            </div>
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${keyword.grade === '다이아' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/10 text-gray-500'
                                }`}>
                                {keyword.grade}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
