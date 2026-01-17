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

interface RegisteredUser {
    id: string;
    pw: string;
    tier: MembershipTier;
    role: UserRole;
}

interface AuthState {
    user: UserInfo | null;
    isAuthenticated: boolean;
    registeredUsers: RegisteredUser[];
    login: (id: string, pw: string) => boolean;
    signup: (id: string, pw: string) => boolean;
    logout: () => void;
    updateTier: (tier: MembershipTier) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            registeredUsers: [
                { id: 'admin', pw: 'admin123', tier: 'SCALE', role: 'admin' },
                { id: 'user', pw: 'user123', tier: 'START', role: 'user' },
                { id: 'grow', pw: '1234', tier: 'GROW', role: 'user' },
                { id: 'scale', pw: '1234', tier: 'SCALE', role: 'user' },
                { id: 'diamond', pw: '1234', tier: 'SCALE', role: 'user' },
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
                            tier: foundUser.tier,
                            accountStatus: foundUser.role === 'admin' ? 'TRUSTED' : 'NORMAL',
                            remainingSearches: foundUser.tier === 'SCALE' ? 999 : (foundUser.tier === 'GROW' ? 20 : 5),
                            currentStep: foundUser.role === 'admin' ? 3 : 1
                        },
                    });
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
                    tier: 'START',
                    role: 'user'
                };

                set({ registeredUsers: [...registeredUsers, newUser] });
                return true;
            },
            logout: () => set({ user: null, isAuthenticated: false }),
            updateTier: (tier) => {
                const { user } = get();
                if (!user) return;

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
