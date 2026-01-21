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
    | 'accessVeo';

interface PermissionRequirement {
    minPlan: MembershipTier;
    minStep: 1 | 2 | 3;
}

// 기능별 맵핑 (Protocol v1.0)
const PERMISSION_MAP: Record<FeatureKey, PermissionRequirement> = {
    editTitlePartial: { minPlan: 'PRO', minStep: 2 },
    editBodyPartial: { minPlan: 'PRO', minStep: 2 },
    editTitleFull: { minPlan: 'ULTRA', minStep: 3 },
    editBodyFull: { minPlan: 'ULTRA', minStep: 3 },
    editStructure: { minPlan: 'ULTRA', minStep: 3 },
    insertCTA: { minPlan: 'ULTRA', minStep: 3 },
    editSlug: { minPlan: 'ULTRA', minStep: 3 },
    manualSchedule: { minPlan: 'ULTRA', minStep: 3 },
    internalDirectKeyword: { minPlan: 'ULTRA', minStep: 3 },
    accessVeo: { minPlan: 'ULTRA', minStep: 3 },
};

const TIER_ORDER: Record<MembershipTier, number> = {
    BASIC: 1,
    PRO: 2,
    ULTRA: 3
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
                    if (criteria.plan === 'BASIC') return false;
                    // Assuming 'publishCount' is intended to be 'completedCount' based on the original function signature
                    // and that the new logic implies an upgrade if completedCount >= 3.
                    // The original logic also checked accountStatus, which is now removed.
                    if (criteria.completedCount >= 3) {
                        set({ currentStep: 2 });
                        return true;
                    }
                }

                // STEP 2 -> 3
                if (currentStep === 2) {
                    if (criteria.plan === 'BASIC') return false;

                    const isHighVolume = criteria.completedCount >= 7; // Changed from criteria.publishCount
                    const canUpgradePlan = criteria.plan === 'ULTRA' || (criteria.plan === 'PRO' && isHighVolume);

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
            name: 'brand-ambassador-step-storage',
        }
    )
);
