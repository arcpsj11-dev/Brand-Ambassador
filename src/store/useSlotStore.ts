import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

    personaSetting: PersonaSetting;
    currentCluster: CurrentCluster;

    isActive: boolean;
    createdAt: string;
    lastActionDate?: string; // YYYY-MM-DD
}

// 사용자 등급 타입
export type UserTier = 'BASIC' | 'PRO' | 'ULTRA';

// 슬롯 스토어 상태 인터페이스
interface SlotState {
    slots: BlogSlot[];
    activeSlotId: string | null;

    // Tier-based limits
    getMaxSlots: (tier: UserTier) => number;
    canCreateSlot: (tier: UserTier) => boolean;

    // CRUD
    createSlot: (config: Partial<BlogSlot>) => string;
    updateSlot: (id: string, updates: Partial<BlogSlot>) => void;
    deleteSlot: (id: string) => void;
    setActiveSlot: (id: string) => void;
    getSlotById: (id: string) => BlogSlot | undefined;

    // Progress
    advanceSlotIndex: (slotId: string) => void;
    resetSlotProgress: (slotId: string) => void;

    // Cluster management
    updateCluster: (slotId: string, cluster: CurrentCluster) => void;

    // Safety
    ensureActiveSlot: () => void;
}

// 등급별 슬롯 제한 맵
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
            createSlot: (config) => {
                const newSlot: BlogSlot = {
                    slotId: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    slotName: config.slotName || '새 블로그',
                    naverBlogId: config.naverBlogId || '',
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

                set((state) => ({
                    slots: [...state.slots, newSlot],
                    activeSlotId: state.activeSlotId || newSlot.slotId
                }));

                return newSlot.slotId;
            },

            // 슬롯 업데이트
            updateSlot: (id, updates) => {
                set((state) => ({
                    slots: state.slots.map((slot) =>
                        slot.slotId === id ? { ...slot, ...updates } : slot
                    )
                }));
            },

            // 슬롯 삭제
            deleteSlot: (id) => {
                set((state) => {
                    const newSlots = state.slots.filter((slot) => slot.slotId !== id);
                    const newActiveId = state.activeSlotId === id
                        ? (newSlots[0]?.slotId || null)
                        : state.activeSlotId;

                    return {
                        slots: newSlots,
                        activeSlotId: newActiveId
                    };
                });
            },

            // 활성 슬롯 설정
            setActiveSlot: (id) => {
                set({ activeSlotId: id });
            },

            // ID로 슬롯 조회
            getSlotById: (id) => {
                return get().slots.find((slot) => slot.slotId === id);
            },

            // 슬롯 인덱스 진행 (발행 완료 시)
            advanceSlotIndex: (slotId) => {
                set((state) => ({
                    slots: state.slots.map((slot) => {
                        if (slot.slotId !== slotId) return slot;

                        let nextIndex = slot.currentCluster.currentIndex + 1;

                        // 10번까지 진행 후 1번으로 리셋
                        if (nextIndex > 10) {
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
                    })
                }));
            },

            // 슬롯 진행도 초기화
            resetSlotProgress: (slotId) => {
                set((state) => ({
                    slots: state.slots.map((slot) =>
                        slot.slotId === slotId
                            ? {
                                ...slot,
                                currentCluster: {
                                    ...slot.currentCluster,
                                    currentIndex: 1
                                }
                            }
                            : slot
                    )
                }));
            },

            // 클러스터 업데이트
            updateCluster: (slotId, cluster) => {
                set((state) => ({
                    slots: state.slots.map((slot) =>
                        slot.slotId === slotId
                            ? { ...slot, currentCluster: cluster }
                            : slot
                    )
                }));
            },

            // 안전장치: 슬롯이 있는데 활성 슬롯이 없으면 첫 번째 선택
            ensureActiveSlot: () => {
                const { slots, activeSlotId } = get();
                if (slots.length > 0 && !activeSlotId) {
                    set({ activeSlotId: slots[0].slotId });
                }
            }
        }),
        {
            name: 'antigravity-slot-storage'
        }
    )
);
