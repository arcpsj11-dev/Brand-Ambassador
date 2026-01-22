import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

export type TopicType = 'pillar' | 'supporting';

export interface Topic {
    day: number;
    type: TopicType;
    title: string;
    description: string;
    isPublished: boolean;
    publishedAt?: string;
}

export interface TopicCluster {
    id: string;
    category: string;
    topics: Topic[];
}

// Slot-specific data structure
export interface SlotTopicData {
    clusters: TopicCluster[];
    currentClusterIndex: number;
    currentTopicIndex: number;
}

interface TopicStoreState {
    // Master storage: slotId -> Data
    slotStats: Record<string, SlotTopicData>;

    // Actions
    setClusters: (slotId: string, clusters: TopicCluster[]) => Promise<void>;
    getNextTopic: (slotId: string) => { topic: Topic; clusterId: string; pillarTitle?: string } | null;
    markAsPublished: (slotId: string, day: number) => Promise<void>;
    setCurrentTopic: (slotId: string, clusterIdx: number, topicIdx: number) => void;
    resetTopics: (slotId: string) => Promise<void>;
    clearAllTopics: () => Promise<void>;
    fetchTopics: (userId: string) => Promise<void>;
    getSlotData: (slotId: string) => SlotTopicData | undefined;
}

export const useTopicStore = create<TopicStoreState>()(
    persist(
        (set, get) => ({
            slotStats: {}, // [NEW] Master storage: slotId -> Data

            setClusters: async (slotId, clusters) => {
                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;

                // Update Local State
                set((state) => ({
                    slotStats: {
                        ...state.slotStats,
                        [slotId]: {
                            clusters,
                            currentClusterIndex: 0,
                            currentTopicIndex: 1 // Start from Day 2 (Skip Pillar)
                        }
                    }
                }));

                // Update DB
                if (userId) {
                    await supabase.from('blog_topics')
                        .upsert({
                            user_id: userId,
                            slot_stats: get().slotStats, // Persist full object
                            updated_at: new Date()
                        }, { onConflict: 'user_id' });
                }
            },

            getNextTopic: (slotId) => {
                const slotData = get().slotStats[slotId];
                if (!slotData || !slotData.clusters || slotData.clusters.length === 0) return null;

                const { clusters, currentClusterIndex, currentTopicIndex } = slotData;

                const currentCluster = clusters[currentClusterIndex];
                if (!currentCluster) return null;

                // Safety check
                if (!currentCluster.topics || !Array.isArray(currentCluster.topics)) {
                    console.error("Malformed Cluster Data:", currentCluster);
                    return null;
                }

                const topic = currentCluster.topics[currentTopicIndex];
                if (!topic) return null;

                // Find pillar title for internal link
                const pillar = currentCluster.topics.find(t => t.type === 'pillar');

                return {
                    topic,
                    clusterId: currentCluster.id,
                    pillarTitle: topic.type === 'supporting' ? pillar?.title : undefined
                };
            },

            markAsPublished: async (slotId, day) => {
                const slotData = get().slotStats[slotId];
                if (!slotData) return;

                const { clusters, currentClusterIndex, currentTopicIndex } = slotData;

                const newClusters = clusters.map((cluster, cIdx) => {
                    if (cIdx !== currentClusterIndex) return cluster;

                    return {
                        ...cluster,
                        topics: cluster.topics.map(t =>
                            t.day === day ? { ...t, isPublished: true, publishedAt: new Date().toISOString() } : t
                        )
                    };
                });

                // Advance pointer
                let nextTopicIdx = currentTopicIndex + 1;
                let nextClusterIdx = currentClusterIndex;

                if (nextTopicIdx >= 10) {
                    nextTopicIdx = 0;
                    nextClusterIdx = (currentClusterIndex + 1) % clusters.length;
                }

                const newSlotData = {
                    ...slotData,
                    clusters: newClusters,
                    currentClusterIndex: nextClusterIdx,
                    currentTopicIndex: nextTopicIdx
                };

                set((state) => ({
                    slotStats: {
                        ...state.slotStats,
                        [slotId]: newSlotData
                    }
                }));

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    await supabase.from('blog_topics')
                        .update({ slot_stats: get().slotStats, updated_at: new Date() })
                        .eq('user_id', userId);
                }
            },

            setCurrentTopic: (slotId, clusterIdx, topicIdx) => {
                set((state) => {
                    const slotData = state.slotStats[slotId];
                    if (!slotData) return state;

                    return {
                        slotStats: {
                            ...state.slotStats,
                            [slotId]: {
                                ...slotData,
                                currentClusterIndex: clusterIdx,
                                currentTopicIndex: topicIdx
                            }
                        }
                    };
                });
            },

            resetTopics: async (slotId) => {
                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;

                set((state) => {
                    const newStats = { ...state.slotStats };
                    delete newStats[slotId]; // Remove data for this slot
                    return { slotStats: newStats };
                });

                if (userId) {
                    await supabase.from('blog_topics')
                        .update({ slot_stats: get().slotStats, updated_at: new Date() })
                        .eq('user_id', userId);
                }
            },

            // Clear ALL topics (e.g. on logout or full reset)
            clearAllTopics: async () => {
                set({ slotStats: {} });
            },

            fetchTopics: async (userId: string) => {
                const { data, error } = await supabase
                    .from('blog_topics')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (data && !error) {
                    // [MIGRATION] Handle legacy format (clusters array) vs new format (slot_stats object)
                    if (data.slot_stats) {
                        set({ slotStats: data.slot_stats });
                    } else if (data.clusters) {
                        // Legacy data found. Assign to a temporary 'legacy' slot or try to migrate if we had access to activeSlotId
                        // Since we don't know the slot ID here, we might just store it in a 'default' slot
                        // or just ignore it if we want a clean slate.
                        // Let's store in 'default' so user doesn't lose data immediately, 
                        // but they will likely need to regenerate if they use proper slots.
                        console.warn("Legacy topic data found. Migrating to 'default' slot.");
                        set({
                            slotStats: {
                                'default': {
                                    clusters: data.clusters,
                                    currentClusterIndex: 0,
                                    currentTopicIndex: 1
                                }
                            }
                        });
                    } else {
                        set({ slotStats: {} });
                    }
                }
            },

            // Helper to get raw data for UI
            getSlotData: (slotId) => get().slotStats[slotId]
        }),
        {
            name: 'brand-ambassador-topic-storage',
            // Note: Zutsand persist will try to load 'clusters' from local storage if we don't clear it.
            // But since we changed the interface, typescript will complain if we don't match.
            // The storage structure changes, so existing local storage data might be invalid.
            // It's acceptable to reset in dev.
        }
    )
);
