import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useSlotStore, type BlogSlot } from './useSlotStore';

// 콘텐츠 상태 타입
export type ContentStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED' | 'LOCKED';

// 오늘의 액션 상태 타입
export type ActionStatus = 'IDLE' | 'STEP_GENERATING' | 'STEP_RISK_CHECK' | 'STEP_SCHEDULING' | 'COMPLETED';

// 리스크 체크 결과 인터페이스
export interface RiskCheckResult {
    passed: boolean;
    violations: Array<{
        text: string;
        reason: string;
        severity: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    suggestions: string[];
}

// 콘텐츠 인터페이스
export interface Content {
    id: string;
    slotId: string;
    title: string;
    body: string;
    status: ContentStatus;
    createdAt: Date;
    updatedAt: Date;
    scheduledPublishAt?: Date;
    riskCheckPassed: boolean;
    riskCheckResults?: RiskCheckResult;
    imagePrompts?: Array<{
        prompt: string;
        alt: string;
    }>;
    logs: Array<{
        original: string;
        modified: string;
        autoCorrected: boolean;
        timestamp: Date;
    }>;
}

// 콘텐츠 스토어 인터페이스
interface ContentState {
    contents: Content[];
    // 오늘의 액션 상태 관리
    actionStatus: ActionStatus;
    lastActionDate: string | null; // YYYY-MM-DD
    completedCount: number; // 이번 달 완료 개수
    regenerationTopic: string | null; // 다시 생성할 주제

    // 콘텐츠 생성
    addContent: (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;

    // 오늘의 액션 상태 변경
    setActionStatus: (status: ActionStatus) => void;
    completeTodayAction: () => void;

    // 콘텐츠 업데이트
    updateContent: (id: string, updates: Partial<Content>) => Promise<void>;
    clearStore: () => void;
    checkAndResetDailyStatus: () => void;
    fetchContents: (userId: string, slotId: string) => Promise<void>;
    purgeSlotArticles: (slotId: string) => Promise<void>;

    // 삭제 함수 제거, 대신 아카이브
    archiveContent: (id: string) => Promise<void>;

    /* 삭제 기능 비활성화 (영구 보관)
    deleteContent: (id: string) => void;
    clearAllContents: () => void;
    */

    // 상태 변경
    updateStatus: (id: string, status: ContentStatus) => Promise<void>;

    // 예약 발행
    schedulePublish: (id: string, date: Date) => Promise<void>;

    // 콘텐츠 조회
    getContentById: (id: string) => Content | undefined;
    getContentsByStatus: (status: ContentStatus) => Content[];
    setRegenerationTopic: (topic: string | null) => void;
    syncWithSlot: (slot: BlogSlot) => void;
}

export const useContentStore = create<ContentState>()((set, get) => ({
    contents: [],
    actionStatus: 'IDLE',
    lastActionDate: null,
    completedCount: 0,
    regenerationTopic: null,

    syncWithSlot: (slot: BlogSlot) => {
        set({
            actionStatus: slot.actionStatus || 'IDLE',
            lastActionDate: slot.lastActionDate || null,
            completedCount: slot.completedCount || 0,
            regenerationTopic: slot.regenerationTopic || null
        });
    },

    addContent: async (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt' | 'slotId'>) => {
        const id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const activeId = useSlotStore.getState().activeSlotId;
        const newContent: Content = {
            ...content,
            id,
            slotId: activeId || '',
<<<<<<< HEAD
            createdAt: new Date(),
            updatedAt: new Date(),
=======
            createdAt: new Date().toISOString() as any,
            updatedAt: new Date().toISOString() as any,
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
            logs: [],
        };

        const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
        if (userId && activeId) {
            await supabase.from('blog_contents').insert([{
                id,
                user_id: userId,
                slot_id: activeId,
                title: newContent.title,
                body: newContent.body,
                status: newContent.status,
                image_prompts: newContent.imagePrompts,
                risk_check_passed: newContent.riskCheckPassed,
            }]);
        }

        set((state: ContentState) => ({
            contents: [...state.contents, newContent],
        }));
        return id;
    },

    setActionStatus: (status: ActionStatus) => {
        const activeId = useSlotStore.getState().activeSlotId;
        if (activeId) {
            useSlotStore.getState().updateSlot(activeId, { actionStatus: status });
        }
        set({ actionStatus: status });
    },

    completeTodayAction: async () => {
        const today = new Date().toISOString().split('T')[0];
        const { completedCount } = get();
        const newCompletedCount = completedCount + 1;

        const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
        const activeId = useSlotStore.getState().activeSlotId;

        if (userId) {
            await supabase.from('users')
                .update({ completed_count: newCompletedCount })
                .eq('id', userId);
        }

        if (activeId) {
            await useSlotStore.getState().updateSlot(activeId, {
                actionStatus: 'COMPLETED',
                lastActionDate: today,
                completedCount: newCompletedCount
            });
        }

        set(() => ({
            actionStatus: 'COMPLETED',
            lastActionDate: today,
            completedCount: newCompletedCount,
        }));
    },

    updateContent: async (id: string, updates: Partial<Content>) => {
        const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
        if (userId) {
            await supabase.from('blog_contents')
                .update({
                    title: updates.title,
                    body: updates.body,
                    status: updates.status,
                    image_prompts: updates.imagePrompts,
<<<<<<< HEAD
                    updated_at: new Date()
=======
                    updated_at: new Date().toISOString()
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
                })
                .eq('id', id)
                .eq('user_id', userId);
        }

        set((state: ContentState) => ({
            contents: state.contents.map((content) =>
                content.id === id
<<<<<<< HEAD
                    ? { ...content, ...updates, updatedAt: new Date() }
=======
                    ? { ...content, ...updates, updatedAt: new Date().toISOString() as any }
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
                    : content
            ),
        }));
    },

    clearStore: () => set({
        contents: [],
        actionStatus: 'IDLE',
        lastActionDate: null,
        completedCount: 0,
        regenerationTopic: null
    }),

    checkAndResetDailyStatus: () => {
        const { lastActionDate } = get() as ContentState;
        const today = new Date().toISOString().split('T')[0];
        if (lastActionDate && lastActionDate !== today) {
            const activeId = useSlotStore.getState().activeSlotId;
            if (activeId) {
                useSlotStore.getState().updateSlot(activeId, { actionStatus: 'IDLE' });
            }
            set({ actionStatus: 'IDLE' });
        }
    },

    fetchContents: async (userId: string, slotId: string) => {
        const { data: contentsData, error: contentsError } = await supabase
            .from('blog_contents')
            .select('*')
            .eq('user_id', userId)
            .eq('slot_id', slotId)
            .order('created_at', { ascending: false });

        const slot = useSlotStore.getState().getSlotById(slotId);

        if (contentsData && !contentsError) {
            set({
                contents: contentsData.map(item => ({
                    id: item.id,
                    slotId: item.slot_id,
                    title: item.title,
                    body: item.body,
                    status: item.status as ContentStatus,
                    createdAt: new Date(item.created_at),
                    updatedAt: new Date(item.updated_at),
                    imagePrompts: item.image_prompts,
                    riskCheckPassed: item.risk_check_passed,
                    logs: []
                })),
                actionStatus: (slot?.actionStatus as ActionStatus) || 'IDLE',
                lastActionDate: slot?.lastActionDate || null,
                completedCount: slot?.completedCount || 0,
                regenerationTopic: slot?.regenerationTopic || null
            });
        }
    },

    purgeSlotArticles: async (slotId) => {
        const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
        if (!userId) return;

        console.log(`[useContentStore] Purging articles for slot: ${slotId}`);

        // 1. Delete from Supabase
        const { error } = await supabase
            .from('blog_contents')
            .delete()
            .eq('user_id', userId)
            .eq('slot_id', slotId);

        if (error) {
            console.error("[useContentStore] Failed to purge articles from Supabase:", error);
            // Even if DB fails, we should sync local state if possible, 
            // but usually we want consistency. For now, log error.
        }

        // 2. Update Local State
        set((state) => ({
            contents: state.contents.filter(c => c.slotId !== slotId)
        }));

        console.log(`[useContentStore] Local state cleared for slot: ${slotId}`);
    },

    archiveContent: async (id: string) => {
        const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
        if (userId) {
            await supabase.from('blog_contents')
                .update({ status: 'ARCHIVED' as ContentStatus, updated_at: new Date() })
                .eq('id', id)
                .eq('user_id', userId);
        }

        set((state: ContentState) => ({
            contents: state.contents.map((content) =>
                content.id === id
                    ? { ...content, status: 'ARCHIVED' as ContentStatus, updatedAt: new Date() }
                    : content
            ),
        }));
    },

    updateStatus: async (id: string, status: ContentStatus) => {
        const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
        if (userId) {
            await supabase.from('blog_contents')
<<<<<<< HEAD
                .update({ status, updated_at: new Date() })
=======
                .update({ status, updated_at: new Date().toISOString() })
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
                .eq('id', id)
                .eq('user_id', userId);
        }

        set((state: ContentState) => ({
            contents: state.contents.map((content) =>
                content.id === id
<<<<<<< HEAD
                    ? { ...content, status, updatedAt: new Date() }
=======
                    ? { ...content, status, updatedAt: new Date().toISOString() as any }
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
                    : content
            ),
        }));
    },

    schedulePublish: async (id: string, date: Date) => {
        const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
        if (userId) {
            await supabase.from('blog_contents')
                .update({
                    status: 'SCHEDULED' as ContentStatus,
                    scheduled_publish_at: date,
                    updated_at: new Date()
                })
                .eq('id', id)
                .eq('user_id', userId);
        }

        set((state: ContentState) => ({
            contents: state.contents.map((content) =>
                content.id === id
                    ? {
                        ...content,
                        status: 'SCHEDULED' as ContentStatus,
                        scheduledPublishAt: date,
                        updatedAt: new Date(),
                    }
                    : content
            ),
        }));
    },

    getContentById: (id: string) => {
        return get().contents.find((content) => content.id === id);
    },

    getContentsByStatus: (status: ContentStatus) => {
        return get().contents.filter((content) => content.status === status);
    },

    setRegenerationTopic: (topic: string | null) => {
        const activeId = useSlotStore.getState().activeSlotId;
        if (activeId) {
            useSlotStore.getState().updateSlot(activeId, { regenerationTopic: topic });
        }
        set({ regenerationTopic: topic });
    },
}));
