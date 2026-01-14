import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BlogDailyMetric {
    date: string;
    views: number;
    likes: number;
    comments: number;
    score: number;
}

interface BlogMetricState {
    metrics: Record<string, BlogDailyMetric[]>; // blogId -> metrics history

    // Actions
    getMetrics: (blogId: string) => BlogDailyMetric[];
    getLatestMetric: (blogId: string) => BlogDailyMetric | null;
    generateMockData: (blogId: string) => void;
}

export const useBlogMetricStore = create<BlogMetricState>()(
    persist(
        (set, get) => ({
            metrics: {},

            getMetrics: (blogId) => {
                return get().metrics[blogId] || [];
            },

            getLatestMetric: (blogId) => {
                const history = get().metrics[blogId];
                if (!history || history.length === 0) return null;
                return history[history.length - 1]; // Return last entry
            },

            generateMockData: (blogId) => {
                const today = new Date();
                const history: BlogDailyMetric[] = [];

                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];

                    // Random metrics generation
                    // Views: 500-2000, Likes: 10-100, Comments: 0-20
                    const views = Math.floor(Math.random() * 1500) + 500;
                    const likes = Math.floor(Math.random() * 90) + 10;
                    const comments = Math.floor(Math.random() * 20);

                    // Score calculation
                    // Simple heuristic: (Views/2000 * 50) + (Likes/100 * 30) + (Comments/20 * 20)
                    // Capped at 100
                    let score = Math.min(100, Math.floor(
                        (Math.min(views, 2000) / 2000 * 50) +
                        (Math.min(likes, 100) / 100 * 30) +
                        (Math.min(comments, 20) / 20 * 20)
                    ));

                    // Random fluctuation for realism
                    score = Math.max(0, Math.min(100, score + Math.floor(Math.random() * 10) - 5));

                    history.push({
                        date: dateStr,
                        views,
                        likes,
                        comments,
                        score
                    });
                }

                set((state) => ({
                    metrics: {
                        ...state.metrics,
                        [blogId]: history
                    }
                }));
            }
        }),
        {
            name: 'blog-metrics-storage',
        }
    )
);

