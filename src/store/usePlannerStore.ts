import { create } from 'zustand';
import { useSlotStore, type BlogSlot } from './useSlotStore';

export type StrategyType = 'A-READ+' | 'A-READ' | 'PASONA' | null;

export interface DailyPlan {
    day: number;
    topic: string;
    description: string;
    status: 'lock' | 'ready' | 'done';
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
    syncWithSlot: (slot: BlogSlot) => void;
}

export const usePlannerStore = create<PlannerState>()((set, get) => ({
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

    syncWithSlot: (slot: BlogSlot) => {
        if (slot.plannerData) {
            set({
                strategy: slot.plannerData.strategy,
                monthlyPlan: slot.plannerData.monthlyPlan,
                persona: slot.plannerData.persona,
                topic: slot.plannerData.topic,
                isScouted: slot.plannerData.isScouted
            });
        } else {
            // [SYNC] Clear state if slot has no planner data
            set({
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
            });
        }
    },

    setStrategy: (strategy) => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const slot = useSlotStore.getState().getSlotById(activeSlotId);
            if (slot) {
                useSlotStore.getState().updateSlot(activeSlotId, {
                    plannerData: { ...slot.plannerData, strategy }
                });
            }
        }
        set({ strategy });
    },

    setMonthlyPlan: (monthlyPlan) => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const slot = useSlotStore.getState().getSlotById(activeSlotId);
            if (slot) {
                useSlotStore.getState().updateSlot(activeSlotId, {
                    plannerData: { ...slot.plannerData, monthlyPlan }
                });
            }
        }
        set({ monthlyPlan });
    },

    setPersona: (persona) => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const slot = useSlotStore.getState().getSlotById(activeSlotId);
            if (slot) {
                useSlotStore.getState().updateSlot(activeSlotId, {
                    plannerData: { ...slot.plannerData, persona }
                });
            }
        }
        set({ persona });
    },

    setTopic: (topic) => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const slot = useSlotStore.getState().getSlotById(activeSlotId);
            if (slot) {
                useSlotStore.getState().updateSlot(activeSlotId, {
                    plannerData: { ...slot.plannerData, topic }
                });
            }
        }
        set({ topic });
    },

    setIsScouted: (isScouted) => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const slot = useSlotStore.getState().getSlotById(activeSlotId);
            if (slot) {
                useSlotStore.getState().updateSlot(activeSlotId, {
                    plannerData: { ...slot.plannerData, isScouted }
                });
            }
        }
        set({ isScouted });
    },

    setActiveDraft: (activeDraft) => set({ activeDraft }),

    updateDayStatus: (day, status) => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        const newPlan = get().monthlyPlan.map(p => p.day === day ? { ...p, status } : p);
        if (activeSlotId) {
            const slot = useSlotStore.getState().getSlotById(activeSlotId);
            if (slot) {
                useSlotStore.getState().updateSlot(activeSlotId, {
                    plannerData: { ...slot.plannerData, monthlyPlan: newPlan }
                });
            }
        }
        set({ monthlyPlan: newPlan });
    },

    clearPlanner: () => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        const clearedData = {
            strategy: null as StrategyType,
            persona: '',
            topic: '',
            isScouted: false,
            monthlyPlan: Array.from({ length: 30 }, (_, i) => ({
                day: i + 1,
                topic: '',
                description: '',
                status: 'lock' as const
            }))
        };
        if (activeSlotId) {
            useSlotStore.getState().updateSlot(activeSlotId, {
                plannerData: clearedData
            });
        }
        set({ ...clearedData });
    },
}));
