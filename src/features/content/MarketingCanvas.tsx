import React, { useState } from 'react';
import { Lock, ChevronRight, Zap, Banana, Loader2 } from 'lucide-react';
import { geminiReasoningService } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlannerStore } from '../../store/usePlannerStore';
import { useChatStore } from '../../store/useChatStore';
import { useUIStore } from '../../store/useUIStore';

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
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm w-fit uppercase tracking-tighter ${plan.type === 'pillar' ? 'bg-brand-primary text-black' : 'bg-white/10 text-gray-400'
                            }`}>
                            {plan.set}-{plan.type}
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
    const ui = useUIStore();
    const { monthlyPlan, isScouted, persona, topic, setMonthlyPlan, setPersona, setTopic, setActiveDraft } = usePlannerStore();
    const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);

    // [나노바나나] 지수 기반 전략 생성 엔진 (AI 리얼 생성)
    const generateChameleonStrategy = async () => {
        if (!topic.trim()) {
            alert('원장님, 마케팅 주제를 먼저 입력해 주세요! 🍌');
            return;
        }

        setIsGeneratingTitles(true);
        try {
            const titles = await geminiReasoningService.generateMonthlyTitles(topic);
            const planWithStatus = titles.map((t: any) => ({
                ...t,
                status: 'ready' as const
            }));
            setMonthlyPlan(planWithStatus);

            const chat = useChatStore.getState();
            chat.addMessage({
                role: 'assistant',
                content: `원장님, 우리 이웃분들께 신뢰를 드릴 수 있는 30일치 클러스터링 전략을 수립했습니다. 🚀 

**[전략 리포트]**
- **Set A (1~10일)**: 질환 원인과 증상 중심의 의학 정보
- **Set B (11~20일)**: 도담한의원의 고유 치료법과 시설 자랑
- **Set C (21~30일)**: 주차, 진료시간 등 실제 내원 전환 유도

각 세트의 첫 번째 글은 전체를 아우르는 '필러(Pillar)' 콘텐츠이며, 나머지는 이를 뒷받침하는 '클러스터(Cluster)' 콘텐츠입니다. 1번 카드부터 원장님의 진심을 담아 검토해 보시지요. ✨`
            });
            chat.setIsOpen(true);
        } catch (error) {
            console.error("Titles Generation Error:", error);
            alert("원장님, 전략 수립 중에 기술적인 결함이 발생했습니다. 다시 시도해 주세요. 🙏");
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
                    <h1 className="text-5xl font-black neon-text uppercase italic tracking-tighter leading-none">Marketing <br /> Canvas</h1>
                    <p className="text-gray-500 font-medium">30일간의 마케팅 캔버스. 제니의 전략 카드를 하나씩 뒤집어 보세요.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
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

                <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-10 gap-3">
                    {monthlyPlan.map((plan: any) => (
                        <MarketingCard
                            key={plan.day}
                            plan={plan}
                            onClick={() => {
                                setActiveDraft(plan);
                                ui.setContentMode('kitchen');
                            }}
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

            {/* 팝업 모달 제거됨: 즉시 이동 로직으로 대체 */}
        </div>
    );
};
