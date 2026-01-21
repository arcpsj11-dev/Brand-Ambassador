import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    addContent: (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) => string;

    // 오늘의 액션 상태 변경
    setActionStatus: (status: ActionStatus) => void;
    completeTodayAction: () => void;

    // 콘텐츠 업데이트
    updateContent: (id: string, updates: Partial<Content>) => void;
    clearStore: () => void;
    checkAndResetDailyStatus: () => void;

    // 삭제 함수 제거, 대신 아카이브
    archiveContent: (id: string) => void;

    /* 삭제 기능 비활성화 (영구 보관)
    deleteContent: (id: string) => void;
    clearAllContents: () => void;
    */

    // 상태 변경
    updateStatus: (id: string, status: ContentStatus) => void;

    // 예약 발행
    schedulePublish: (id: string, date: Date) => void;

    // 콘텐츠 조회
    getContentById: (id: string) => Content | undefined;
    getContentsByStatus: (status: ContentStatus) => Content[];
    setRegenerationTopic: (topic: string | null) => void;
}

export const useContentStore = create<ContentState>()(
    persist(
        (set, get) => ({
            contents: [],
            actionStatus: 'IDLE',
            lastActionDate: null,
            completedCount: 0,
            regenerationTopic: null,

            addContent: (content) => {
                const id = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const newContent: Content = {
                    ...content,
                    id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    logs: [],
                };
                set((state) => ({
                    contents: [...state.contents, newContent],
                }));
                return id;
            },

            setActionStatus: (status) => set({ actionStatus: status }),

            completeTodayAction: () => {
                const today = new Date().toISOString().split('T')[0];
                set((state) => ({
                    actionStatus: 'COMPLETED',
                    lastActionDate: today,
                    completedCount: state.completedCount + 1,
                }));
            },

            updateContent: (id, updates) => {
                set((state) => ({
                    contents: state.contents.map((content) =>
                        content.id === id
                            ? { ...content, ...updates, updatedAt: new Date() }
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
                const { lastActionDate } = get();
                const today = new Date().toISOString().split('T')[0];
                if (lastActionDate && lastActionDate !== today) {
                    set({ actionStatus: 'IDLE' });
                }
            },

            // 삭제 대신 아카이브
            archiveContent: (id) => {
                set((state) => ({
                    contents: state.contents.map((content) =>
                        content.id === id
                            ? { ...content, status: 'ARCHIVED' as ContentStatus, updatedAt: new Date() }
                            : content
                    ),
                }));
            },

            updateStatus: (id, status) => {
                set((state) => ({
                    contents: state.contents.map((content) =>
                        content.id === id
                            ? { ...content, status, updatedAt: new Date() }
                            : content
                    ),
                }));
            },

            /* 삭제 기능 비활성화 (영구 보관)
            deleteContent: (id) => {
                set((state) => ({
                    contents: state.contents.filter((content) => content.id !== id),
                }));
            },

            clearAllContents: () => {
                set({ contents: [], completedCount: 0, lastActionDate: null, actionStatus: 'IDLE' });
            },
            */

            schedulePublish: (id, date) => {
                set((state) => ({
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

            getContentById: (id) => {
                return get().contents.find((content) => content.id === id);
            },

            getContentsByStatus: (status) => {
                return get().contents.filter((content) => content.status === status);
            },

            setRegenerationTopic: (topic) => set({ regenerationTopic: topic }),
        }),
        {
            name: 'brand-ambassador-content-storage',
        }
    )
);
