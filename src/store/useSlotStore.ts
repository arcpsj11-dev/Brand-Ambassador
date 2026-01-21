import { create } from 'zustand';
import { type MembershipTier } from './useAuthStore';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

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

    isActive: boolean;
    createdAt: string;
    lastActionDate?: string; // YYYY-MM-DD
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
                    isActive: config.isActive !== undefined ? config.isActive : true,
                    createdAt: new Date().toISOString(),
                    lastActionDate: config.lastActionDate || new Date().toISOString().split('T')[0]
                };

                const { slots, activeSlotId } = get();
                const newSlots = [...slots, newSlot];
                const newActiveId = activeSlotId || newSlot.slotId;

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    await supabase.from('blog_slots')
                        .upsert({ user_id: userId, slots: newSlots, active_slot_id: newActiveId, updated_at: new Date() }, { onConflict: 'user_id' });
                }

                set({
                    slots: newSlots,
                    activeSlotId: newActiveId
                });

                return newSlot.slotId;
            },

            // 슬롯 업데이트
            updateSlot: async (id: string, updates: Partial<BlogSlot>) => {
                const { slots } = get() as SlotState;
                const newSlots = slots.map((slot: BlogSlot) =>
                    slot.slotId === id ? { ...slot, ...updates } : slot
                );

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    await supabase.from('blog_slots')
                        .update({ slots: newSlots, updated_at: new Date() })
                        .eq('user_id', userId);
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

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    await supabase.from('blog_slots')
                        .update({ slots: newSlots, active_slot_id: newActiveId, updated_at: new Date() })
                        .eq('user_id', userId);
                }

                set({
                    slots: newSlots,
                    activeSlotId: newActiveId
                });
            },

            // 활성 슬롯 설정
            setActiveSlot: async (id) => {
                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    await supabase.from('blog_slots')
                        .update({ active_slot_id: id, updated_at: new Date() })
                        .eq('user_id', userId);
                }
                set({ activeSlotId: id });
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
                    await supabase.from('blog_slots')
                        .update({ slots: newSlots, updated_at: new Date() })
                        .eq('user_id', userId);
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
                    await supabase.from('blog_slots')
                        .update({ slots: newSlots, updated_at: new Date() })
                        .eq('user_id', userId);
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
                    await supabase.from('blog_slots')
                        .update({ slots: newSlots, updated_at: new Date() })
                        .eq('user_id', userId);
                }

                set({ slots: newSlots });
            },

            // 안전장치: 슬롯이 있는데 활성 슬롯이 없으면 첫 번째 선택
            ensureActiveSlot: () => {
                const { slots, activeSlotId } = get();
                if (slots.length > 0 && !activeSlotId) {
                    set({ activeSlotId: slots[0].slotId });
                }
            },
            clearStore: () => set({ slots: [], activeSlotId: null }),

            fetchSlots: async (userId: string) => {
                const { data, error } = await supabase
                    .from('blog_slots')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (data && !error) {
                    set({
                        slots: data.slots || [],
                        activeSlotId: data.active_slot_id || (data.slots && data.slots[0]?.slotId) || null
                    });
                }
            }
        }),
        {
            name: 'brand-ambassador-slot-storage'
        }
    )
);
