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

interface TopicStoreState {
    clusters: TopicCluster[];
    currentClusterIndex: number;
    currentTopicIndex: number;

    // Actions
    setClusters: (clusters: TopicCluster[]) => Promise<void>;
    getNextTopic: () => { topic: Topic; clusterId: string; pillarTitle?: string } | null;
    markAsPublished: (day: number) => Promise<void>;
    setCurrentTopic: (clusterIdx: number, topicIdx: number) => void;
    resetTopics: () => Promise<void>;
    fetchTopics: (userId: string) => Promise<void>;
}

export const useTopicStore = create<TopicStoreState>()(
    persist(
        (set, get) => ({
            clusters: [],
            currentClusterIndex: 0,
            currentTopicIndex: 0,

            setClusters: async (clusters) => {
                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    await supabase.from('blog_topics')
                        .upsert({ user_id: userId, clusters, updated_at: new Date() }, { onConflict: 'user_id' });
                }

                set({
                    clusters,
                    currentClusterIndex: 0,
                    currentTopicIndex: 1 // [User Request] Start from 2nd topic (Skip Pillar/Day 1 initially)
                });
            },

            getNextTopic: () => {
                const { clusters, currentClusterIndex, currentTopicIndex } = get();
                if (clusters.length === 0) return null;

                const currentCluster = clusters[currentClusterIndex];
                if (!currentCluster) return null;

                // [FIX] Safety check for malformed AI data
                if (!currentCluster.topics || !Array.isArray(currentCluster.topics)) {
                    console.error("Malformed Cluster Data:", currentCluster);
                    return null;
                }

                const topic = currentCluster.topics[currentTopicIndex];
                if (!topic) return null;

                // Find pillar title for internal link (if current is supporting)
                const pillar = currentCluster.topics.find(t => t.type === 'pillar');

                return {
                    topic,
                    clusterId: currentCluster.id,
                    pillarTitle: topic.type === 'supporting' ? pillar?.title : undefined
                };
            },

            markAsPublished: async (day) => {
                const { clusters, currentClusterIndex, currentTopicIndex } = get();
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

                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    await supabase.from('blog_topics')
                        .update({ clusters: newClusters, updated_at: new Date() })
                        .eq('user_id', userId);
                }

                set({
                    clusters: newClusters,
                    currentTopicIndex: nextTopicIdx,
                    currentClusterIndex: nextClusterIdx
                });
            },

            // [NEW] Manual Jump
            setCurrentTopic: (clusterIdx: number, topicIdx: number) => {
                set({ currentClusterIndex: clusterIdx, currentTopicIndex: topicIdx });
            },

            resetTopics: async () => {
                const userId = (await import('./useAuthStore')).useAuthStore.getState().user?.id;
                if (userId) {
                    await supabase.from('blog_topics').delete().eq('user_id', userId);
                }
                set({ clusters: [], currentClusterIndex: 0, currentTopicIndex: 0 });
            },

            fetchTopics: async (userId: string) => {
                const { data, error } = await supabase
                    .from('blog_topics')
                    .select('*')
                    .eq('user_id', userId)
                    .single();

                if (data && !error) {
                    set({
                        clusters: data.clusters,
                        // We might want to persist current index too in DB, but for now just topics
                    });
                }
            }
        }),
        {
            name: 'brand-ambassador-topic-storage',
        }
    )
);
