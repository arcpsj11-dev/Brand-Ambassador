import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'user';
export type MembershipTier = 'Free' | 'Silver' | 'Diamond';

interface UserInfo {
    id: string;
    role: UserRole;
    tier: MembershipTier;
    remainingSearches: number;
}

interface AuthState {
    user: UserInfo | null;
    isAuthenticated: boolean;
    login: (id: string, pw: string) => boolean;
    logout: () => void;
    useSearch: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            login: (id, pw) => {
                // 가상 로그인 로직
                if (id === 'admin' && pw === 'admin123') {
                    set({
                        isAuthenticated: true,
                        user: { id: 'admin', role: 'admin', tier: 'Diamond', remainingSearches: 999 },
                    });
                    return true;
                } else if (id === 'user' && pw === 'user123') {
                    set({
                        isAuthenticated: true,
                        user: { id: 'user', role: 'user', tier: 'Free', remainingSearches: 5 },
                    });
                    return true;
                } else if (id === 'diamond' && pw === '1234') {
                    set({
                        isAuthenticated: true,
                        user: { id: 'diamond', role: 'user', tier: 'Diamond', remainingSearches: 100 },
                    });
                    return true;
                }
                return false;
            },
            logout: () => set({ user: null, isAuthenticated: false }),
            useSearch: () => {
                const { user } = get();
                if (user && user.remainingSearches > 0) {
                    set({ user: { ...user, remainingSearches: user.remainingSearches - 1 } });
                }
            },
        }),
        {
            name: 'jenny-auth-storage',
        }
    )
);
