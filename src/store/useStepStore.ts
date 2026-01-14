import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MembershipTier } from './useAuthStore';

// 권한 요건 인터페이스
export type FeatureKey =
    | 'editTitlePartial'
    | 'editBodyPartial'
    | 'editTitleFull'
    | 'editBodyFull'
    | 'editStructure'
    | 'insertCTA'
    | 'editSlug'
    | 'manualSchedule'
    | 'internalDirectKeyword'
    | 'accessOPG'
    | 'accessVeo';

interface PermissionRequirement {
    minPlan: MembershipTier;
    minStep: 1 | 2 | 3;
}

// 기능별 맵핑 (Protocol v1.0)
const PERMISSION_MAP: Record<FeatureKey, PermissionRequirement> = {
    editTitlePartial: { minPlan: 'GROW', minStep: 2 },
    editBodyPartial: { minPlan: 'GROW', minStep: 2 },
    editTitleFull: { minPlan: 'SCALE', minStep: 3 },
    editBodyFull: { minPlan: 'SCALE', minStep: 3 },
    editStructure: { minPlan: 'SCALE', minStep: 3 },
    insertCTA: { minPlan: 'SCALE', minStep: 3 },
    editSlug: { minPlan: 'SCALE', minStep: 3 },
    manualSchedule: { minPlan: 'SCALE', minStep: 3 },
    internalDirectKeyword: { minPlan: 'SCALE', minStep: 3 },
    accessOPG: { minPlan: 'GROW', minStep: 2 },
    accessVeo: { minPlan: 'SCALE', minStep: 3 },
};

const TIER_ORDER: Record<MembershipTier, number> = {
    START: 1,
    GROW: 2,
    SCALE: 3
};

interface StepStoreState {
    currentStep: 1 | 2 | 3;
    editSuccessCount: number;
    riskCorrectionCount: number;
    hasSeenStep3Celebrate: boolean;

    // 권한 확인 (Intersection Logic)
    canAccess: (feature: FeatureKey, plan: MembershipTier) => { granted: boolean; reason?: 'PLAN' | 'STEP' };

    // STEP 진행 및 업그레이드
    checkAndUpgrade: (criteria: { completedCount: number; accountStatus: string; plan: MembershipTier }) => boolean;
    syncUpgrade: (completedCount: number) => void;
    incrementEditSuccess: () => void;
    incrementRiskCorrection: () => void;
    setSeenStep3Celebrate: (val: boolean) => void;
    setStep: (step: 1 | 2 | 3) => void;
}

export const useStepStore = create<StepStoreState>()(
    persist(
        (set, get) => ({
            currentStep: 1,
            editSuccessCount: 0,
            riskCorrectionCount: 0,
            hasSeenStep3Celebrate: false,

            canAccess: (feature, plan) => {
                const req = PERMISSION_MAP[feature];
                const { currentStep } = get();

                const planMeets = TIER_ORDER[plan] >= TIER_ORDER[req.minPlan];
                const stepMeets = currentStep >= req.minStep;

                if (!planMeets) return { granted: false, reason: 'PLAN' };
                if (!stepMeets) return { granted: false, reason: 'STEP' };

                return { granted: true };
            },

            incrementEditSuccess: () => set(state => ({ editSuccessCount: state.editSuccessCount + 1 })),
            incrementRiskCorrection: () => set(state => ({ riskCorrectionCount: state.riskCorrectionCount + 1 })),
            setSeenStep3Celebrate: (val) => set({ hasSeenStep3Celebrate: val }),

            checkAndUpgrade: (criteria) => {
                const { currentStep, editSuccessCount, riskCorrectionCount } = get();

                // STEP 1 -> 2
                if (currentStep === 1) {
                    if (criteria.plan === 'START') return false;
                    if (criteria.completedCount >= 3 && criteria.accountStatus !== 'RESTRICTED') {
                        set({ currentStep: 2 });
                        return true;
                    }
                }

                // STEP 2 -> 3
                if (currentStep === 2) {
                    // SCALE 또는 GROW 플랜에서 발행 건수가 많으면(7회 이상) 승급 가능성 부여
                    const isHighVolume = criteria.completedCount >= 7;
                    const canUpgradePlan = criteria.plan === 'SCALE' || (criteria.plan === 'GROW' && isHighVolume);

                    if (!canUpgradePlan) return false;

                    if (criteria.completedCount >= 5 &&
                        (editSuccessCount >= 1 || isHighVolume) && // 편집 횟수 요건 완화 (고발행자 기준)
                        riskCorrectionCount < 5 &&
                        (criteria.accountStatus === 'TRUSTED' || criteria.accountStatus === 'NORMAL')) {

                        set({ currentStep: 3 });
                        return true;
                    }
                }

                return false;
            },

            syncUpgrade: (completedCount) => {
                const { currentStep } = get();
                if (currentStep === 1 && completedCount >= 3) {
                    set({ currentStep: 2 });
                }
            },

            setStep: (step) => set({ currentStep: step }),
        }),
        {
            name: 'antigravity-step-storage',
        }
    )
);
