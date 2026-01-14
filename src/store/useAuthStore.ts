import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'user';
export type MembershipTier = 'START' | 'GROW' | 'SCALE';
export type AccountStatus = 'NORMAL' | 'WARNING' | 'RESTRICTED' | 'TRUSTED';

interface UserInfo {
    id: string;
    role: UserRole;
    tier: MembershipTier;
    accountStatus: AccountStatus;
    remainingSearches: number;
    currentStep: 1 | 2 | 3;
}

interface AuthState {
    user: UserInfo | null;
    isAuthenticated: boolean;
    login: (id: string, pw: string) => boolean;
    logout: () => void;
    updateTier: (tier: MembershipTier) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            login: (id, pw) => {
                // Protocol v1.0 기반 초기 유저 정보 설정
                if (id === 'admin' && pw === 'admin123') {
                    set({
                        isAuthenticated: true,
                        user: {
                            id: 'admin',
                            role: 'admin',
                            tier: 'SCALE',
                            accountStatus: 'TRUSTED',
                            remainingSearches: 999,
                            currentStep: 3
                        },
                    });
                    return true;
                } else if (id === 'user' && pw === 'user123') {
                    set({
                        isAuthenticated: true,
                        user: {
                            id: 'user',
                            role: 'user',
                            tier: 'START',
                            accountStatus: 'NORMAL',
                            remainingSearches: 5,
                            currentStep: 1
                        },
                    });
                    return true;
                } else if (id === 'grow' && pw === '1234') {
                    set({
                        isAuthenticated: true,
                        user: {
                            id: 'grow',
                            role: 'user',
                            tier: 'GROW',
                            accountStatus: 'NORMAL',
                            remainingSearches: 20,
                            currentStep: 1 // 가입 시점엔 무조건 1부터
                        },
                    });
                    return true;
                } else if (id === 'scale' && pw === '1234') {
                    set({
                        isAuthenticated: true,
                        user: {
                            id: 'scale',
                            role: 'user',
                            tier: 'SCALE',
                            accountStatus: 'NORMAL',
                            remainingSearches: 50,
                            currentStep: 1 // SCALE이어도 적응 기간 동안은 1
                        },
                    });
                    return true;
                }
                return false;
            },
            logout: () => set({ user: null, isAuthenticated: false }),
            updateTier: (tier) => {
                const { user } = get();
                if (!user) return;

                // 요금제 다운그레이드 시 STEP Cap 강제 적용 로직
                let newStep = user.currentStep;
                if (tier === 'START') newStep = 1;
                else if (tier === 'GROW' && newStep > 2) newStep = 2;

                set({ user: { ...user, tier, currentStep: newStep as 1 | 2 | 3 } });
            }
        }),
        {
            name: 'jenny-auth-storage',
        }
    )
);
