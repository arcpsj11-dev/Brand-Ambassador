import React, { useState, useEffect } from 'react';
import { Target, ChevronRight, Lock, Trophy, Clock, ShieldCheck, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContentStore } from '../../store/useContentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useStepStore } from '../../store/useStepStore';
import { TodayActionFlow } from './TodayActionFlow';
import { useSlotStore } from '../../store/useSlotStore';
import { useTopicStore } from '../../store/useTopicStore';

/**
 * 오늘의 액션 카드 컴포넌트
 * 일일 1건의 작업만 표시 (관리자는 바이패스 가능)
 */
export const TodayAction: React.FC = () => {
    const { actionStatus, setActionStatus, completedCount, regenerationTopic } = useContentStore();
    const { getNextTopic } = useTopicStore();
    const { slots, activeSlotId } = useSlotStore();
    const { syncUpgrade } = useStepStore();
    const { user } = useAuthStore();
    const [showFlow, setShowFlow] = useState(false);

    const activeSlot = slots.find(s => s.slotId === activeSlotId);

    // Calculate Next Topic Title from Topic Store (which is now synced with active slot)
    const nextTopicData = getNextTopic();
    const targetTopicTitle = nextTopicData?.topic.title || '';

    // STEP 동기화: 기존 포스팅 개수가 이미 기준치를 넘었을 경우 자동으로 승급
    useEffect(() => {
        syncUpgrade(completedCount);
    }, [completedCount, syncUpgrade]);

    const today = new Date().toISOString().split('T')[0];
    const isAdmin = user?.role === 'admin';

    // 개별 슬롯의 잠금 상태 확인
    const slotLastActionDate = activeSlot?.lastActionDate;
    const isLocked = slotLastActionDate === today && !isAdmin && !regenerationTopic;
    const hasCompletedToday = slotLastActionDate === today;
    const isResuming = actionStatus !== 'IDLE' && actionStatus !== 'COMPLETED';

    const handleStart = () => {
        if (isLocked) return;

        // 관리자 재실행 시 상태 초기화
        if (isAdmin && hasCompletedToday && actionStatus === 'COMPLETED') {
            setActionStatus('IDLE');
        }

        setShowFlow(true);
    };

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {showFlow && <TodayActionFlow onClose={() => setShowFlow(false)} />}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card p-6 border-brand-primary/20 bg-gradient-to-br from-brand-primary/10 to-transparent relative overflow-hidden ${isLocked ? 'grayscale opacity-70' : 'hover:shadow-neon transition-all'
                    }`}
            >
                {/* Admin Bypass Badge */}
                {isAdmin && hasCompletedToday && (
                    <div className="absolute top-0 right-0 bg-brand-primary text-black text-[8px] font-black px-3 py-1 uppercase tracking-tighter rounded-bl-lg shadow-neon flex items-center gap-1">
                        <ShieldCheck size={10} /> Admin Bypass Active
                    </div>
                )}

                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isLocked ? 'bg-gray-800 text-gray-400' : 'bg-brand-primary/20 text-brand-primary shadow-neon-sm'
                        }`}>
                        {isLocked ? <Lock size={24} /> : <Target size={24} />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-gray-500' : 'text-brand-primary'
                                }`}>
                                {isLocked ? 'Action Locked' : isAdmin && hasCompletedToday ? 'Admin Override' : "Today's Action"}
                            </span>
                            <div className="w-1 h-3 bg-white/10 rounded-full" />
                            <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${activeSlot ? 'text-gray-400' : 'text-red-500 animate-pulse'
                                }`}>
                                <LayoutGrid size={10} />
                                {activeSlot?.slotName || '이용할 블로그 슬롯을 먼저 선택해주세요'}
                            </span>
                            {!isLocked && <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />}
                        </div>
                        <h3 className="font-black text-lg mb-1 line-clamp-1">
                            {regenerationTopic
                                ? `[${regenerationTopic}] 재생성`
                                : isLocked
                                    ? '오늘의 액션 완료'
                                    : targetTopicTitle
                                        ? targetTopicTitle
                                        : isAdmin && hasCompletedToday
                                            ? '오늘의 액션 (관리자 재실행)'
                                            : activeSlot
                                                ? `${activeSlot.slotName} 콘텐츠 발행하기`
                                                : '슬롯을 선택해주세요'
                            }
                        </h3>
                        <p className="text-sm text-gray-500 line-clamp-1">
                            {!activeSlot
                                ? '상단의 슬롯 선택기에서 글을 작성할 블로그를 선택한 후 시작할 수 있습니다.'
                                : regenerationTopic
                                    ? `선택하신 '${regenerationTopic}' 주제로 AI 글쓰기를 시작합니다.`
                                    : isLocked
                                        ? '오늘의 할당량을 완료했습니다. 내일 오전 9시에 새로운 액션이 열립니다.'
                                        : targetTopicTitle
                                            ? `다음 플랜: ${targetTopicTitle}`
                                            : isAdmin && hasCompletedToday
                                                ? '관리자 권한으로 일일 제한을 무시하고 새로운 액션을 실행할 수 있습니다.'
                                                : 'A-READ 구조 기반의 맞춤형 콘텐츠 생성을 시작합니다.'}
                        </p>
<<<<<<< HEAD
=======

                        {/* [NEW] Mini Progress Map (10-day cluster visualization) */}
                        {activeSlot && (
                            <div className="flex gap-1 mt-4 max-w-[200px]">
                                {Array.from({ length: 10 }).map((_, i) => {
                                    // currentCluster.currentIndex is 1-indexed (1 to 10)
                                    // So done if i < currentIndex - 1 ? 
                                    // Actually TodayAction shows progress as "current / total".
                                    // If currentIndex is 1, it means we are ON topic 1 (day 1 of cluster).
                                    const currentIndex = activeSlot.currentCluster.currentIndex;
                                    const isDone = i + 1 < currentIndex;
                                    const isActive = i + 1 === currentIndex;

                                    return (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${isDone ? 'bg-brand-primary shadow-neon-sm' :
                                                    isActive ? 'bg-brand-primary/40 animate-pulse ring-1 ring-brand-primary/30' :
                                                        'bg-white/10'
                                                }`}
                                        />
                                    );
                                })}
                            </div>
                        )}
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
                    </div>
                    {!isLocked && (
                        <div className="w-auto mt-0">
                            <button
                                onClick={handleStart}
                                disabled={!activeSlot}
                                className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-neon-sm ${activeSlot
                                    ? 'bg-brand-primary text-black hover:scale-105'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                                    }`}
                            >
                                {isResuming ? '이어서 진행' : isAdmin && hasCompletedToday ? '재실행' : '시작'}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                            <Trophy size={16} className="text-brand-primary" />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-gray-500 uppercase leading-none mb-1">Current Progress</div>
                            <div className="text-sm font-black italic">
                                {activeSlot?.currentCluster.currentIndex || 0} / {activeSlot ? (1 + (activeSlot.currentCluster.satelliteTitles?.length || 9)) : 10}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                            <Clock size={16} className="text-gray-400" />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-gray-500 uppercase leading-none mb-1">Next Action</div>
                            <div className="text-sm font-bold text-white">내일 09:00</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <ShieldCheck size={16} className="text-green-500" />
                        </div>
                        <div>
                            <div className="text-[9px] font-black text-gray-500 uppercase leading-none mb-1">Safety Engine</div>
                            <div className="text-sm font-bold text-green-500 uppercase">Active</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
