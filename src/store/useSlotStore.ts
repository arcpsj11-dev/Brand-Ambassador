import { create } from 'zustand';
import { type MembershipTier } from './useAuthStore';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import { type TopicCluster } from './useTopicStore';
import { type DailyPlan, type StrategyType } from './usePlannerStore';

// 페르소나 설정 인터페이스
export interface PersonaSetting {
    jobTitle: string;           // 예: "한의사", "IT 전문가", "맛집 블로거"
    toneAndManner: string;      // 예: "신뢰감 있는", "트렌디한", "친절한"
    expertise: string[];        // 전문 분야
}

// 토픽 클러스터 인터페이스
export interface CurrentCluster {
    pillarTitle: string;        // Index 1 (필러 포스트)
    satelliteTitles: string[];  // Index 2-10 (보조 포스트)
    currentIndex: number;       // 현재 진행 중인 인덱스 (1~10)
}

// 블로그 슬롯 인터페이스
export interface BlogSlot {
    slotId: string;
    slotName: string;           // 사용자 지정 이름
    naverBlogId: string;
    occupationId: string;

    personaSetting: PersonaSetting;
    currentCluster: CurrentCluster;

    // [Unified Data] Slot-specific topics and planning
    clusters: TopicCluster[];
    currentClusterIndex: number;
    currentTopicIndex: number;

    plannerData: {
        strategy: StrategyType;
        monthlyPlan: DailyPlan[];
        persona: string;
        topic: string;
        isScouted: boolean;
    };

    // [Unified Data] Daily Action Progress
    actionStatus: 'IDLE' | 'STEP_GENERATING' | 'STEP_RISK_CHECK' | 'STEP_SCHEDULING' | 'COMPLETED';
    lastActionDate: string | null;
    completedCount: number;
    regenerationTopic: string | null;

    isActive: boolean;
    createdAt: string;
}

// 사용자 등급 타입 (Align with useAuthStore)
export type UserTier = MembershipTier;

// 슬롯 스토어 상태 인터페이스
interface SlotState {
    slots: BlogSlot[];
    activeSlotId: string | null;

    // Tier-based limits
    getMaxSlots: (tier: UserTier) => number;
    canCreateSlot: (tier: UserTier) => boolean;

    // CRUD
    createSlot: (config: Partial<BlogSlot>) => Promise<string>;
    updateSlot: (id: string, updates: Partial<BlogSlot>) => Promise<void>;
    deleteSlot: (id: string) => Promise<void>;
    setActiveSlot: (id: string) => Promise<void>;
    getSlotById: (id: string) => BlogSlot | undefined;

    // Progress
    advanceSlotIndex: (slotId: string) => Promise<void>;
    resetSlotProgress: (slotId: string) => Promise<void>;

    // Cluster management
    updateCluster: (slotId: string, cluster: CurrentCluster) => Promise<void>;

    // Safety
    ensureActiveSlot: () => void;
    clearStore: () => void;
    fetchSlots: (userId: string) => Promise<void>;
}

// 등급별 슬롯 제한 맵 (Fallback defaults)
const TIER_SLOT_LIMITS: Record<UserTier, number> = {
    BASIC: 1,
    PRO: 3,
    ULTRA: 5
};

export const useSlotStore = create<SlotState>()(
    persist(
        (set, get) => ({
            slots: [],
            activeSlotId: null,

            // 등급별 최대 슬롯 개수 반환
            getMaxSlots: (tier: UserTier) => {
                return TIER_SLOT_LIMITS[tier] || 1;
            },

            // 슬롯 생성 가능 여부 확인
            canCreateSlot: (tier: UserTier) => {
                const maxSlots = get().getMaxSlots(tier);
                const currentSlots = get().slots.length;
                return currentSlots < maxSlots;
            },

            // 슬롯 생성
            createSlot: async (config) => {
                const newSlot: BlogSlot = {
                    slotId: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    slotName: config.slotName || '새 블로그',
                    naverBlogId: config.naverBlogId || '',
                    occupationId: config.occupationId || 'doctor', // Default
                    personaSetting: config.personaSetting || {
                        jobTitle: '전문가',
                        toneAndManner: '신뢰감 있는',
                        expertise: []
                    },
                    currentCluster: config.currentCluster || {
                        pillarTitle: '',
                        satelliteTitles: [],
                        currentIndex: 1
                    },
                    clusters: config.clusters || [],
                    currentClusterIndex: config.currentClusterIndex || 0,
                    currentTopicIndex: config.currentTopicIndex || 0,
                    plannerData: config.plannerData || {
                        strategy: null,
                        monthlyPlan: Array.from({ length: 30 }, (_, i) => ({
                            day: i + 1,
                            topic: '',
                            description: '',
                            status: 'lock' as const
                        })),
                        persona: '',
                        topic: '',
                        isScouted: false
                    },
                    actionStatus: config.actionStatus || 'IDLE',
                    lastActionDate: config.lastActionDate || null,
                    completedCount: config.completedCount || 0,
                    regenerationTopic: config.regenerationTopic || null,
                    isActive: config.isActive !== undefined ? config.isActive : true,
                    createdAt: new Date().toISOString()
                };

                const { slots, activeSlotId } = get();
                const newSlots = [...slots, newSlot];
                const newActiveId = activeSlotId || newSlot.slotId;

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    try {
                        const { error } = await supabase.from('blog_slots')
                            .upsert({ user_id: userId, slots: newSlots, active_slot_id: newActiveId, updated_at: new Date() }, { onConflict: 'user_id' });
                        if (error) throw error;
                    } catch (err: any) {
                        // Ignore 'Table not found' error to allow local-only mode
                        if (err.code !== 'PGRST205' && err.message?.indexOf('not find the table') === -1) {
                            console.error('[useSlotStore] Sync Error:', err);
                        }
                    }
                }

                set({
                    slots: newSlots,
                    activeSlotId: newActiveId
                });

                return newSlot.slotId;
            },

            // 슬롯 업데이트
            // 슬롯 업데이트
            updateSlot: async (id: string, updates: Partial<BlogSlot>) => {
                const { slots } = get() as SlotState;
                const newSlots = slots.map((slot: BlogSlot) =>
                    slot.slotId === id ? { ...slot, ...updates } : slot
                );

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    try {
                        const { error } = await supabase.from('blog_slots')
                            .update({ slots: newSlots, updated_at: new Date() })
                            .eq('user_id', userId);
                        if (error) throw error;
                    } catch (err: any) {
                        if (err.code !== 'PGRST205' && err.message?.indexOf('not find the table') === -1) {
                            console.error('[useSlotStore] Sync Error:', err);
                        }
                    }
                }

                set({ slots: newSlots });
            },

            // 슬롯 삭제
            deleteSlot: async (id: string) => {
                const { slots, activeSlotId } = get() as SlotState;
                const newSlots = slots.filter((slot: BlogSlot) => slot.slotId !== id);
                const newActiveId = activeSlotId === id
                    ? (newSlots[0]?.slotId || null)
                    : activeSlotId;

                // [DEEP PURGE] Delete all associated contents
                const { useContentStore } = await import('./useContentStore');
                await useContentStore.getState().purgeSlotArticles(id);

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    try {
                        const { error } = await supabase.from('blog_slots')
                            .update({ slots: newSlots, active_slot_id: newActiveId, updated_at: new Date() })
                            .eq('user_id', userId);
                        if (error) throw error;
                    } catch (err: any) {
                        if (err.code !== 'PGRST205' && err.message?.indexOf('not find the table') === -1) {
                            console.error('[useSlotStore] Sync Error:', err);
                        }
                    }
                }

                set({
                    slots: newSlots,
                    activeSlotId: newActiveId
                });
            },

            // 활성 슬롯 설정
            setActiveSlot: async (id) => {
                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                console.log(`[useSlotStore] setActiveSlot called with ID: ${id}`);

                if (userId) {
                    try {
                        const { error } = await supabase.from('blog_slots')
                            .update({ active_slot_id: id, updated_at: new Date() })
                            .eq('user_id', userId);
                        if (error) throw error;
                    } catch (err: any) {
                        if (err.code !== 'PGRST205' && err.message?.indexOf('not find the table') === -1) {
                            console.error('[useSlotStore] Sync Error:', err);
                        }
                    }
                }
                set({ activeSlotId: id });

                // [SYNC] Sync other stores when slot changes
                const slot = get().slots.find(s => s.slotId === id);
                if (slot) {
                    console.log(`[useSlotStore] Found slot ${slot.slotName}, importing stores...`);
                    const { useTopicStore } = await import('./useTopicStore');
                    const { usePlannerStore } = await import('./usePlannerStore');
                    const { useContentStore } = await import('./useContentStore');

                    console.log(`[useSlotStore] Calling syncWithSlot for useTopicStore...`);
                    useTopicStore.getState().syncWithSlot(slot);
                    usePlannerStore.getState().syncWithSlot(slot);
                    useContentStore.getState().syncWithSlot(slot);
                    if (userId) {
                        await useContentStore.getState().fetchContents(userId, id);
                    } else {
                        console.warn('[useSlotStore] userId missing, skipping fetchContents');
                    }
                } else {
                    console.warn(`[useSlotStore] Slot with ID ${id} not found in local state!`);
                }
            },

            // ID로 슬롯 조회
            getSlotById: (id) => {
                return get().slots.find((slot) => slot.slotId === id);
            },

            // 슬롯 인덱스 진행 (발행 완료 시)
            advanceSlotIndex: async (slotId) => {
                const { slots } = get();
                const newSlots = slots.map((slot) => {
                    if (slot.slotId !== slotId) return slot;

                    let nextIndex = slot.currentCluster.currentIndex + 1;
                    const maxIndex = 1 + (slot.currentCluster.satelliteTitles?.length || 9);

                    if (nextIndex > maxIndex) {
                        nextIndex = 1;
                    }

                    return {
                        ...slot,
                        currentCluster: {
                            ...slot.currentCluster,
                            currentIndex: nextIndex
                        },
                        lastActionDate: new Date().toISOString().split('T')[0]
                    };
                });

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    try {
                        const { error } = await supabase.from('blog_slots')
                            .update({ slots: newSlots, updated_at: new Date() })
                            .eq('user_id', userId);
                        if (error) throw error;
                    } catch (err: any) {
                        if (err.code !== 'PGRST205' && err.message?.indexOf('not find the table') === -1) {
                            console.error('[useSlotStore] Sync Error:', err);
                        }
                    }
                }

                set({ slots: newSlots });
            },

            // 슬롯 진행도 초기화
            resetSlotProgress: async (slotId) => {
                const { slots } = get();
                const newSlots = slots.map((slot) =>
                    slot.slotId === slotId
                        ? {
                            ...slot,
                            currentCluster: {
                                ...slot.currentCluster,
                                currentIndex: 1
                            }
                        }
                        : slot
                );

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    try {
                        const { error } = await supabase.from('blog_slots')
                            .update({ slots: newSlots, updated_at: new Date() })
                            .eq('user_id', userId);
                        if (error) throw error;
                    } catch (err: any) {
                        if (err.code !== 'PGRST205' && err.message?.indexOf('not find the table') === -1) {
                            console.error('[useSlotStore] Sync Error:', err);
                        }
                    }
                }

                set({ slots: newSlots });
            },

            // 클러스터 업데이트
            updateCluster: async (slotId: string, cluster: CurrentCluster) => {
                const { slots } = get() as SlotState;
                const newSlots = slots.map((slot: BlogSlot) =>
                    slot.slotId === slotId
                        ? { ...slot, currentCluster: cluster }
                        : slot
                );

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    try {
                        const { error } = await supabase.from('blog_slots')
                            .update({ slots: newSlots, updated_at: new Date() })
                            .eq('user_id', userId);
                        if (error) throw error;
                    } catch (err: any) {
                        if (err.code !== 'PGRST205' && err.message?.indexOf('not find the table') === -1) {
                            console.error('[useSlotStore] Sync Error:', err);
                        }
                    }
                }

                set({ slots: newSlots });
            },

            // 안전장치: 슬롯이 있는데 활성 슬롯이 없으면 첫 번째 선택
            ensureActiveSlot: async () => {
                const { slots, activeSlotId, setActiveSlot } = get();
                if (slots.length > 0 && !activeSlotId) {
                    await setActiveSlot(slots[0].slotId);
                }
            },
            clearStore: () => set({ slots: [], activeSlotId: null }),

            fetchSlots: async (userId: string) => {
                let data = null;
                let error = null;

                try {
                    const result = await supabase
                        .from('blog_slots')
                        .select('*')
                        .eq('user_id', userId)
                        .maybeSingle(); // Use maybeSingle to avoid 406/JSON error if no row

                    data = result.data;
                    error = result.error;

                    if (error) throw error;
                } catch (err: any) {
                    // Ignore 406 (Not Acceptable) or Table Missing errors
                    if (err.code !== 'PGRST205' && err.code !== 'PGRST116' && err.message?.indexOf('not find the table') === -1 && err.code !== '406') {
                        console.warn('[useSlotStore] Fetch Error (Ignored):', err);
                    }
                    return; // Stop if fetch fails (fallback to local state)
                }

                if (data && !error) {
                    const slots = data.slots || [];
                    const activeSlotId = data.active_slot_id || (slots[0]?.slotId) || null;

                    set({
                        slots,
                        activeSlotId
                    });

                    // Sync if we have an active slot
                    if (activeSlotId) {
                        const slot = slots.find((s: BlogSlot) => s.slotId === activeSlotId);
                        if (slot) {
                            const { useTopicStore } = await import('./useTopicStore');
                            const { usePlannerStore } = await import('./usePlannerStore');
                            const { useContentStore } = await import('./useContentStore');

                            useTopicStore.getState().syncWithSlot(slot);
                            usePlannerStore.getState().syncWithSlot(slot);
                            useContentStore.getState().syncWithSlot(slot);
                            await useContentStore.getState().fetchContents(userId, activeSlotId);
                        }
                    }

                    // [ZOMBIE PURGE] One-time cleanup of legacy data
                    try {
                        console.log("Zombie Purge: Sweeping away legacy data for", userId);

                        // 1. [REMOVED] blog_topics table is deprecated. No need to delete.
                        // const { error: topicError } = await supabase.from('blog_topics').delete().eq('user_id', userId);

                        // 2. Clear old localStorage keys
                        localStorage.removeItem('brand-ambassador-topic-storage');
                        localStorage.removeItem('brand-ambassador-planner-storage');

                        // 3. Clear unassigned contents (Zombie articles without slot_id)
                        await supabase.from('blog_contents').delete().eq('user_id', userId).is('slot_id', null);

                        // 4. [NEW] Clear contents belonging to slots that no longer exist
                        if (slots.length > 0) {
                            const activeSlotIds = slots.map((s: BlogSlot) => s.slotId);
                            // Delete articles where slot_id is NOT in the list of active slots
                            await supabase.from('blog_contents')
                                .delete()
                                .eq('user_id', userId)
                                .not('slot_id', 'in', `(${activeSlotIds.join(',')})`);
                        }

                        console.log("Zombie Purge: Successfully cleaned up all zombie materials.");
                    } catch (purgeError: any) {
                        // Completely silence 404 or table missing errors
                        if (purgeError?.code !== 'PGRST205' && purgeError?.message?.indexOf('not find') === -1) {
                            console.warn("Zombie Purge Error (Non-Critical):", purgeError);
                        }
                    }
                }
            }
        }),
        {
            name: 'brand-ambassador-slot-storage',
            onRehydrateStorage: () => (state) => {
                if (state && state.activeSlotId) {
                    const slot = state.slots.find(s => s.slotId === state.activeSlotId);
                    if (slot) {
                        // Use delayed import or global access if needed, but since it's inside a function it's fine
                        import('./useTopicStore').then(m => m.useTopicStore.getState().syncWithSlot(slot));
                        import('./usePlannerStore').then(m => m.usePlannerStore.getState().syncWithSlot(slot));
                    }
                }
            }
        }
    )
);
