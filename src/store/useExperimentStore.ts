import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'CLOSED';
export type StepType = 'STEP1_KEYWORDS' | 'STEP2_TITLE' | 'STEP3_INTRO' | 'STEP4_BODY' | 'STEP5_TONE';

export interface Variant {
    id: string; // e.g., 'A', 'B'
    name: string;
    description?: string;
    promptContent: string; // The raw prompt template
    trafficWeight: number; // 0-100 (percentage)
    isActive: boolean;
    metrics: {
        generationCount: number;
        avgQualityScore?: number; // 추후 확장: 사용자 피드백 점수 등
    };
}

export interface Experiment {
    id: string;
    name: string;
    description: string;
    targetStep: StepType;
    status: ExperimentStatus;
    variants: Variant[];
    createdAt: string;
    winnerVariantId?: string;
}

interface ExperimentState {
    experiments: Experiment[];

    // Actions
    createExperiment: (experiment: Omit<Experiment, 'id' | 'createdAt' | 'variants'>) => void;
    addVariant: (experimentId: string, variant: Omit<Variant, 'metrics'>) => void;
    updateVariant: (experimentId: string, variantId: string, updates: Partial<Variant>) => void;
    deleteExperiment: (experimentId: string) => void;
    setExperimentStatus: (experimentId: string, status: ExperimentStatus) => void;

    // Runtime Logic
    incrementVariantUsage: (experimentId: string, variantId: string) => void;
    getActiveExperiment: (step: StepType) => Experiment | undefined;
}

export const useExperimentStore = create<ExperimentState>()(
    persist(
        (set, get) => ({
            experiments: [],

            createExperiment: (data) => set((state) => ({
                experiments: [
                    {
                        ...data,
                        id: Date.now().toString(),
                        createdAt: new Date().toISOString(),
                        variants: [], // 초기에는 변수 없음
                        status: 'DRAFT'
                    },
                    ...state.experiments
                ]
            })),

            addVariant: (experimentId, variantData) => set((state) => ({
                experiments: state.experiments.map(exp =>
                    exp.id === experimentId
                        ? {
                            ...exp,
                            variants: [...exp.variants, { ...variantData, metrics: { generationCount: 0 } }]
                        }
                        : exp
                )
            })),

            updateVariant: (experimentId, variantId, updates) => set((state) => ({
                experiments: state.experiments.map(exp =>
                    exp.id === experimentId
                        ? {
                            ...exp,
                            variants: exp.variants.map(v =>
                                v.id === variantId ? { ...v, ...updates } : v
                            )
                        }
                        : exp
                )
            })),

            deleteExperiment: (experimentId) => set((state) => ({
                experiments: state.experiments.filter(exp => exp.id !== experimentId)
            })),

            setExperimentStatus: (experimentId, status) => set((state) => ({
                experiments: state.experiments.map(exp =>
                    exp.id === experimentId ? { ...exp, status } : exp
                )
            })),

            incrementVariantUsage: (experimentId, variantId) => set((state) => ({
                experiments: state.experiments.map(exp =>
                    exp.id === experimentId
                        ? {
                            ...exp,
                            variants: exp.variants.map(v =>
                                v.id === variantId
                                    ? { ...v, metrics: { ...v.metrics, generationCount: v.metrics.generationCount + 1 } }
                                    : v
                            )
                        }
                        : exp
                )
            })),

            getActiveExperiment: (step) => {
                // 해당 Step의 RUNNING 상태인 실험을 반환
                // (여러 개일 경우 가장 최근 것 하나만 적용 정책)
                return get().experiments.find(exp => exp.targetStep === step && exp.status === 'RUNNING');
            }
        }),
        {
            name: 'ab-experiment-storage',
            storage: createJSONStorage(() => localStorage)
        }
    )
);
