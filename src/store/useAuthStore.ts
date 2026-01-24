import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useContentStore } from './useContentStore';
import { useTopicStore } from './useTopicStore';
import { useSlotStore } from './useSlotStore';
import { usePlannerStore } from './usePlannerStore';

import { supabase } from '../lib/supabaseClient';

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
    usageCount: number;
}

interface AuthState {
    user: UserInfo | null;
    isAuthenticated: boolean;
    login: (id: string, pw: string) => Promise<{ success: boolean; error?: string }>;
    signup: (id: string, pw: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateTier: (tier: MembershipTier) => void;
    setHasSeenManual: (seen: boolean) => void;
    refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            login: async (id, pw) => {
                const { data: foundUser, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', id)
                    .eq('pw', pw)
                    .single();

                if (error) {
                    console.error("Login Error:", error);
                    return { success: false, error: error.message };
                }

                if (foundUser) {
                    const isExpired = foundUser.expires_at && new Date() > new Date(foundUser.expires_at);
                    const finalTier = (isExpired && foundUser.auto_adjustment) ? 'BASIC' : foundUser.tier;

                    set({
                        isAuthenticated: true,
                        user: {
                            id: foundUser.id,
                            role: foundUser.role,
                            tier: finalTier as MembershipTier,
                            accountStatus: foundUser.role === 'admin' ? 'TRUSTED' : 'NORMAL',
                            remainingSearches: finalTier === 'ULTRA' ? 999 : (finalTier === 'PRO' ? 20 : 5),
                            currentStep: foundUser.role === 'admin' ? 3 : 1,
                            expiresAt: foundUser.expires_at,
                            autoAdjustment: foundUser.auto_adjustment,
                            hasSeenManual: foundUser.has_seen_manual || false,
                            usageCount: foundUser.usage_count || 0
                        },
                    });

                    // Hydrate all data from Supabase - CENTRALIZED in Slot Store
                    const userId = foundUser.id;
                    await useSlotStore.getState().fetchSlots(userId);

                    useContentStore.getState().checkAndResetDailyStatus();
                    return { success: true };
                }
                return { success: false, error: '아이디 또는 비밀번호가 일치하지 않습니다.' };
            },
            signup: async (id, pw) => {
                // Check if exists
                const { data: existing, error: checkError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', id)
                    .single();

                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "Row not found" (which is good)
                    return { success: false, error: `중복 확인 중 오류: ${checkError.message}` };
                }

                if (existing) return { success: false, error: '이미 존재하는 아이디입니다.' };

                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                const { error } = await supabase
                    .from('users')
                    .insert([{
                        id,
                        pw,
                        tier: 'BASIC',
                        role: 'user',
                        auto_adjustment: true,
                        expires_at: expiresAt,
                        usage_count: 0
                    }]);

                if (error) {
                    console.error("Signup Error:", error);
                    return { success: false, error: error.message };
                }

                return { success: true };
            },
            refreshUser: async () => {
                const { user } = get();
                if (!user) return;

                const { data: foundUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (foundUser) {
                    set({
                        user: {
                            ...user,
                            tier: foundUser.tier as MembershipTier,
                            expiresAt: foundUser.expires_at,
                            autoAdjustment: foundUser.auto_adjustment,
                            usageCount: foundUser.usage_count || 0,
                            hasSeenManual: foundUser.has_seen_manual || false
                        }
                    });
                }
            },
            logout: () => {
                set({ user: null, isAuthenticated: false });
                // Clear other stores to prevent session leakage
                useContentStore.getState().clearStore();
                useTopicStore.getState().clearAllTopics();
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
