import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type StrategyType = 'A-READ+' | 'A-READ' | 'PASONA' | null;

export interface DailyPlan {
    day: number;
    topic: string;
    description: string;
    status: 'lock' | 'ready' | 'done';
    type?: 'pillar' | 'cluster';
    set?: 'A' | 'B' | 'C';
}

interface PlannerState {
    strategy: StrategyType;
    monthlyPlan: DailyPlan[];
    persona: string;
    topic: string;
    isScouted: boolean; // 지수 탐사 여부
    activeDraft: DailyPlan | null; // 현재 편집 중인 드래프트
    setStrategy: (strategy: StrategyType) => void;
    setMonthlyPlan: (plan: DailyPlan[]) => void;
    setPersona: (persona: string) => void;
    setTopic: (topic: string) => void;
    setIsScouted: (isScouted: boolean) => void;
    setActiveDraft: (plan: DailyPlan | null) => void;
    updateDayStatus: (day: number, status: 'lock' | 'ready' | 'done') => void;
    clearPlanner: () => void;
}

export const usePlannerStore = create<PlannerState>()(
    persist(
        (set) => ({
            strategy: null,
            monthlyPlan: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                topic: '',
                description: '',
                status: 'lock' as const
            })),
            persona: '',
            topic: '',
            isScouted: false,
            activeDraft: null,
            setStrategy: (strategy) => set({ strategy }),
            setMonthlyPlan: (monthlyPlan) => set({ monthlyPlan }),
            setPersona: (persona) => set({ persona }),
            setTopic: (topic) => set({ topic }),
            setIsScouted: (isScouted) => set({ isScouted }),
            setActiveDraft: (activeDraft) => set({ activeDraft }),
            updateDayStatus: (day, status) => set((state) => ({
                monthlyPlan: state.monthlyPlan.map(p => p.day === day ? { ...p, status } : p)
            })),
            clearPlanner: () => set({
                strategy: null,
                persona: '',
                topic: '',
                isScouted: false,
                monthlyPlan: Array.from({ length: 30 }, (_, i) => ({
                    day: i + 1,
                    topic: '',
                    description: '',
                    status: 'lock' as const
                }))
            }),
        }),
        {
            name: 'jenny-planner-storage',
        }
    )
);
