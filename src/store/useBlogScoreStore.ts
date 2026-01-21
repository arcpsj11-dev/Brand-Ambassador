import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BlogScoreAnalysis } from '../services/blogScoreService';

interface BlogScoreState {
    // Cached score data
    lastScore: BlogScoreAnalysis | null;

    // Actions
    updateScore: (score: BlogScoreAnalysis) => void;
    clearScore: () => void;

    // Helpers
    shouldRefresh: () => boolean;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const useBlogScoreStore = create<BlogScoreState>()(
    persist(
        (set, get) => ({
            lastScore: null,

            updateScore: (score) => set({ lastScore: score }),

            clearScore: () => set({ lastScore: null }),

            /**
             * Check if score should be refreshed
             * Returns true if:
             * - No score exists
             * - Last update was more than 24 hours ago
             */
            shouldRefresh: () => {
                const { lastScore } = get();

                if (!lastScore) return true;

                const lastUpdate = new Date(lastScore.lastUpdated).getTime();
                const now = Date.now();

                return (now - lastUpdate) > CACHE_DURATION;
            }
        }),
        {
            name: 'brand-ambassador-blog-score-storage',
        }
    )
);
