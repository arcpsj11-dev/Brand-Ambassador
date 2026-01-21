import React, { useState } from 'react';
import { Lock, ChevronRight, Zap, Banana, Loader2, Trash2 } from 'lucide-react';
import { geminiReasoningService } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlannerStore } from '../../store/usePlannerStore';
import { useTopicStore } from '../../store/useTopicStore';
import { useBrandStore } from '../../store/useBrandStore';
import { useChatStore } from '../../store/useChatStore';

// [나노바나나] 마케팅 카드 컴포넌트
const MarketingCard: React.FC<{ plan: any; onClick: () => void }> = ({ plan, onClick }) => {
    const isLocked = plan.status === 'lock';
    const isDone = plan.status === 'done';

    return (
        <motion.div
            whileHover={!isLocked ? { scale: 1.05, y: -5 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            onClick={!isLocked ? onClick : undefined}
            className={`relative aspect-[3/4] glass-card p-3 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden ${isLocked ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-brand-primary/50 hover:shadow-neon'
                } ${isDone ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}
        >
            {/* 배경 데코 */}
            <div className="absolute top-0 right-0 p-3 opacity-5">
                <span className="text-4xl font-black italic">{plan.day}</span>
            </div>

            <header className="flex justify-between items-start z-10">
                <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-black tracking-widest uppercase ${isDone ? 'text-yellow-500' : 'text-gray-500'}`}>
                        Day {String(plan.day).padStart(2, '0')}
                    </span>
                    {plan.type && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${plan.type === 'pillar'
                            ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                            : 'bg-white/5 text-gray-400 border border-white/10'
                            }`}>
                            {plan.type === 'pillar' ? '필러글' : '보조글'}
                        </span>
                    )}
                </div>
                {isLocked ? <Lock size={14} className="text-gray-600" /> :
                    isDone ? <Banana size={16} className="text-yellow-500 fill-yellow-500 animate-pulse" /> :
                        <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shadow-neon" />}
            </header>

            <main className="z-10 mt-4 flex-1">
                {isLocked ? (
                    <div className="h-full flex flex-col justify-center gap-2">
                        <div className="w-8 h-1 bg-white/5 rounded-full" />
                        <div className="w-12 h-1 bg-white/5 rounded-full" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <h4 className="font-black text-[10px] italic leading-tight group-hover:text-brand-primary transition-colors line-clamp-3">
                            {plan.topic || '주제를 생성 중...'}
                        </h4>
                        <p className="text-[9px] text-gray-500 line-clamp-3 leading-relaxed">
                            {plan.description || '제니의 마케팅 뇌가 전략을 수립하면 이곳에 공개됩니다.'}
                        </p>
                    </div>
                )}
            </main>

            <footer className="z-10 flex justify-between items-center mt-4">
                {!isLocked && (
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/30" />
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/30" />
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary/30" />
                    </div>
                )}
                {isDone ? (
                    <span className="text-[9px] font-black text-yellow-500 uppercase">Success</span>
                ) : !isLocked && (
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-brand-primary" />
                )}
            </footer>
        </motion.div>
    );
};

export const MarketingCanvas: React.FC = () => {
    const brand = useBrandStore();
    const { monthlyPlan, isScouted, persona, topic, setMonthlyPlan, setPersona, setTopic, clearPlanner } = usePlannerStore();
    const { setClusters, resetTopics } = useTopicStore();
    const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);

    // [나노바나나] 데이터 초기화 (Reset)
    const handleClearAll = () => {
        if (window.confirm("지금까지 생성된 모든 기획 내용과 주제를 삭제하시겠습니까? \n(되돌릴 수 없습니다)")) {
            clearPlanner();
            resetTopics();
            alert("모든 기획 데이터가 초기화되었습니다.");
        }
    };

    // [나노바나나] 지수 기반 전략 생성 엔진 (AI 리얼 생성)
    const generateChameleonStrategy = async () => {
        if (!persona.trim() || !topic.trim()) {
            alert('원장님, 페르소나와 주제를 먼저 입력해주세요! 🍌');
            return;
        }

        setIsGeneratingTitles(true);
        const score = brand.blogIndex;
        let strat: 'A-READ+' | 'A-READ' | 'PASONA' = 'A-READ+';

        if (score >= 30 && score < 70) strat = 'A-READ';
        if (score >= 70) strat = 'PASONA';

        try {
            const titlesData = await geminiReasoningService.generateMonthlyTitles(topic);
            const allTopics: any[] = [];

            if (titlesData.clusters && Array.isArray(titlesData.clusters)) {
                titlesData.clusters.forEach((cluster: any) => {
                    if (cluster.pillar) allTopics.push({ ...cluster.pillar, type: 'pillar' });
                    if (cluster.satellites) {
                        allTopics.push(...cluster.satellites.map((s: any) => ({ ...s, type: 'supporting' })));
                    }
                });
            }

            const planWithStatus = allTopics.map((t: any) => ({
                ...t,
                status: 'ready' as const
            }));
            setMonthlyPlan(planWithStatus);

            // [SYNC] Execution Store 동기화 (30일치 데이터)
            if (titlesData.clusters) {
                // TopicStore가 기대하는 형식(Topic[])으로 변환
                const formattedClusters = titlesData.clusters.map((cluster: any, idx: number) => ({
                    id: `cluster-${Date.now()}-${idx}`,
                    category: cluster.pillar?.title || `Cluster ${idx + 1}`,
                    topics: [
                        { ...cluster.pillar, type: 'pillar', status: 'ready' },
                        ...(cluster.satellites || []).map((t: any) => ({ ...t, type: 'supporting', status: 'ready' }))
                    ]
                }));
                setClusters(formattedClusters);
            }

            const chat = useChatStore.getState();
            chat.addMessage({
                role: 'assistant',
                content: `원장님, 우리 이웃분들께 신뢰를 드릴 수 있는 30일치 제목들을 준비했습니다. 🚀 특히 ${strat} 전략을 녹여 전문가의 통찰력이 돋보이도록 구성했으니, 1번 카드부터 차근차근 검토해 보시지요. ✨`
            });
            chat.setIsOpen(true);
        } catch (error: any) {
            console.error("Titles Generation Error:", error);
            if (error.message === "USAGE_LIMIT_REACHED") {
                alert("원장님, 이번 달(또는 현재 등급)의 AI 생성 사용 한도에 도달했습니다.\n\n한도 증액이나 등급 상향은 관리자에게 문의해 주세요! 🚀");
            } else {
                alert("원장님, 제목을 뽑는 중에 제니 회로에 바나나가 꼈나 봐요! 다시 시도해 주세요. 💦");
            }
        } finally {
            setIsGeneratingTitles(false);
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[9px] font-black uppercase tracking-widest">
                        <Banana size={12} /> Nano Banana Core
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black neon-text uppercase italic tracking-tighter leading-none">Marketing <br /> Canvas</h1>
                    <p className="text-gray-500 font-medium text-sm lg:text-base">30일간의 마케팅 캔버스. 제니의 전략 카드를 하나씩 뒤집어 보세요.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    {/* [NEW] Clear All Button */}
                    {isScouted && (
                        <button
                            onClick={handleClearAll}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-3 rounded-xl transition-all border border-red-500/20 mt-auto"
                            title="모든 기획 데이터 초기화"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}

                    <div className="flex-1 lg:w-48 space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Persona</label>
                        <input
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            placeholder="예: 15년차 한의학 박사"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-brand-primary transition-all outline-none"
                        />
                    </div>
                    <div className="flex-1 lg:w-48 space-y-1">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Main Topic</label>
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="예: 교통사고 추나치료"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-brand-primary transition-all outline-none"
                        />
                    </div>

                    {!isScouted ? (
                        <div className="glass-card px-8 py-3 flex items-center gap-4 border-dashed border-white/10 opacity-50 grayscale mt-auto">
                            <Lock size={16} className="text-gray-500" />
                            <p className="text-[10px] font-bold text-gray-500 leading-tight">지수 탐사를 <br />먼저 실행해주세요</p>
                        </div>
                    ) : (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={generateChameleonStrategy}
                            disabled={isGeneratingTitles}
                            className="bg-brand-primary text-black px-8 py-3 rounded-xl font-black flex items-center gap-3 hover:shadow-neon transition-all uppercase italic mt-auto disabled:opacity-50"
                        >
                            {isGeneratingTitles ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                            {isGeneratingTitles ? 'Cooking Titles...' : 'Deploy Strategy'}
                        </motion.button>
                    )}
                </div>
            </header>

            {/* 메인 캔버스 덱 */}
            <div className="relative">
                {!isScouted && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-3xl border border-white/5 space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                            <Lock size={32} className="text-gray-600" />
                        </div>
                        <p className="font-black text-gray-500 tracking-widest uppercase text-sm">Waiting for Index Scouting</p>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3">
                    {monthlyPlan.map((plan: any) => (
                        <MarketingCard
                            key={plan.day}
                            plan={plan}
                            onClick={() => { }} // [Modified] Read-only as per unified workflow
                        />
                    ))}
                </div>

                {/* 제목 생성 로딩 오버레이 */}
                <AnimatePresence>
                    {isGeneratingTitles && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md rounded-3xl border border-brand-primary/20"
                        >
                            <div className="relative group">
                                <div className="absolute inset-0 bg-brand-primary/20 blur-3xl rounded-full animate-pulse" />
                                <div className="relative flex flex-col items-center space-y-6">
                                    <div className="w-20 h-20 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon" />
                                    <div className="text-center space-y-2">
                                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase neon-text">Jenny is Kitchen-Cooking...</h3>
                                        <p className="text-xs text-gray-400 font-medium">도담한의원을 위한 킬러 제목 30개를 엄선하고 있어요!</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
