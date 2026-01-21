import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useContentStore } from './useContentStore';
import { useTopicStore } from './useTopicStore';
import { useSlotStore } from './useSlotStore';
import { usePlannerStore } from './usePlannerStore';

export type UserRole = 'admin' | 'user';
export type MembershipTier = 'BASIC' | 'PRO' | 'ULTRA';
export type AccountStatus = 'NORMAL' | 'WARNING' | 'RESTRICTED' | 'TRUSTED';

interface UserInfo {
    id: string;
    role: UserRole;
    tier: MembershipTier;
    accountStatus: AccountStatus;
    remainingSearches: number;
    currentStep: 1 | 2 | 3;
    expiresAt?: string;
    autoAdjustment?: boolean;
    hasSeenManual?: boolean;
}

interface RegisteredUser {
    id: string;
    pw: string;
    tier: MembershipTier;
    role: UserRole;
    expiresAt?: string;
    autoAdjustment?: boolean;
}

interface AuthState {
    user: UserInfo | null;
    isAuthenticated: boolean;
    registeredUsers: RegisteredUser[];
    login: (id: string, pw: string) => boolean;
    signup: (id: string, pw: string) => boolean;
    logout: () => void;
    updateTier: (tier: MembershipTier) => void;
    setHasSeenManual: (seen: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            registeredUsers: [
                { id: 'admin', pw: 'admin123', tier: 'ULTRA', role: 'admin' },
                { id: 'user', pw: 'user123', tier: 'BASIC', role: 'user', autoAdjustment: true },
                { id: 'grow', pw: '1234', tier: 'PRO', role: 'user', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), autoAdjustment: true },
                { id: 'scale', pw: '1234', tier: 'ULTRA', role: 'user', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), autoAdjustment: true },
                { id: 'diamond', pw: '1234', tier: 'ULTRA', role: 'user' },
            ],
            login: (id, pw) => {
                const { registeredUsers } = get();
                const foundUser = registeredUsers.find(u => u.id === id && u.pw === pw);

                if (foundUser) {
                    set({
                        isAuthenticated: true,
                        user: {
                            id: foundUser.id,
                            role: foundUser.role,
                            tier: (foundUser.expiresAt && new Date() > new Date(foundUser.expiresAt) && foundUser.autoAdjustment) ? 'BASIC' : foundUser.tier,
                            accountStatus: foundUser.role === 'admin' ? 'TRUSTED' : 'NORMAL',
                            remainingSearches: foundUser.tier === 'ULTRA' ? 999 : (foundUser.tier === 'PRO' ? 20 : 5),
                            currentStep: foundUser.role === 'admin' ? 3 : 1,
                            expiresAt: foundUser.expiresAt,
                            autoAdjustment: foundUser.autoAdjustment,
                            hasSeenManual: false // Default to false on login
                        },
                    });

                    // Trigger daily reset check immediately after login
                    useContentStore.getState().checkAndResetDailyStatus();

                    return true;
                }
                return false;
            },
            signup: (id, pw) => {
                const { registeredUsers } = get();
                if (registeredUsers.some(u => u.id === id)) {
                    return false; // 이미 존재하는 아이디
                }

                const newUser: RegisteredUser = {
                    id,
                    pw,
                    tier: 'BASIC',
                    role: 'user'
                };

                set({ registeredUsers: [...registeredUsers, newUser] });
                return true;
            },
            logout: () => {
                set({ user: null, isAuthenticated: false });
                // Clear other stores to prevent session leakage
                useContentStore.getState().clearStore();
                useTopicStore.getState().resetTopics();
                useSlotStore.getState().clearStore();
                usePlannerStore.getState().clearPlanner();
            },
            updateTier: (tier) => {
                const { user } = get();
                if (!user) return;

                let newStep = user.currentStep;
                if (tier === 'BASIC') newStep = 1;
                else if (tier === 'PRO' && newStep > 2) newStep = 2;

                set({ user: { ...user, tier, currentStep: newStep as 1 | 2 | 3 } });
            },
            setHasSeenManual: (seen) => {
                const { user } = get();
                if (user) {
                    set({ user: { ...user, hasSeenManual: seen } });
                }
            }
        }),
        {
            name: 'brand-ambassador-auth-storage',
        }
    )
);
