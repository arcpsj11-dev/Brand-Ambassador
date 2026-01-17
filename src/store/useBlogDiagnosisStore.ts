import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type DiagnosisStatus = 'RED' | 'YELLOW' | 'GREEN' | 'UNKNOWN';

export interface BlogMetrics {
    recentPostCount: number; // 최근 7일 발행량
    indexErrorRate: number; // 색인 누락률 (0~100%)
    keywordExposureRate: number; // 주요 키워드 노출률
}

export interface DiagnosisSnapshot {
    id: string; // timestamp based ID
    date: string; // ISO Date
    blogId: string;
    status: DiagnosisStatus;
    score: number;
    metrics: BlogMetrics;
    facts: string[];
    solution: string[];
    jennyComment: string; // 제니의 코멘트 저장
}

interface BlogDiagnosisState {
    snapshots: DiagnosisSnapshot[];

    // Actions
    addSnapshot: (snapshot: Omit<DiagnosisSnapshot, 'id' | 'date'>) => void;
    getHistory: (blogId: string) => DiagnosisSnapshot[];
    getLatestSnapshot: (blogId: string) => DiagnosisSnapshot | null;
    getTodaySnapshot: (blogId: string) => DiagnosisSnapshot | null;
    clearHistory: () => void;
}

export const useBlogDiagnosisStore = create<BlogDiagnosisState>()(
    persist(
        (set, get) => ({
            snapshots: [],

            addSnapshot: (data) => set((state) => {
                const newSnapshot: DiagnosisSnapshot = {
                    ...data,
                    id: Date.now().toString(),
                    date: new Date().toISOString()
                };
                // 최근 30개만 유지 (너무 많이 쌓이면 정리)
                const updated = [newSnapshot, ...state.snapshots].slice(0, 30);
                return { snapshots: updated };
            }),

            getHistory: (blogId) => {
                return get().snapshots
                    .filter(s => s.blogId === blogId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            },

            getLatestSnapshot: (blogId) => {
                const history = get().getHistory(blogId);
                return history.length > 0 ? history[0] : null;
            },

            getTodaySnapshot: (blogId) => {
                const latest = get().getLatestSnapshot(blogId);
                if (!latest) return null;
                const today = new Date().toISOString().split('T')[0];
                const snapshotDate = latest.date.split('T')[0];
                return today === snapshotDate ? latest : null;
            },

            clearHistory: () => set({ snapshots: [] })
        }),
        {
            name: 'blog-diagnosis-storage',
            storage: createJSONStorage(() => localStorage)
        }
    )
);
