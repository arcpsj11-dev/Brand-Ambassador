import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
    setClusters: (clusters: TopicCluster[]) => void;
    getNextTopic: () => { topic: Topic; clusterId: string; pillarTitle?: string } | null;
    markAsPublished: (topicId: number) => void;
    setCurrentTopic: (clusterIdx: number, topicIdx: number) => void;
    resetTopics: () => void;
}

export const useTopicStore = create<TopicStoreState>()(
    persist(
        (set, get) => ({
            clusters: [],
            currentClusterIndex: 0,
            currentTopicIndex: 0,

            setClusters: (clusters) => set({
                clusters,
                currentClusterIndex: 0,
                currentTopicIndex: 1 // [User Request] Start from 2nd topic (Skip Pillar/Day 1 initially)
            }),

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

            markAsPublished: (day) => {
                set((state) => {
                    const newClusters = state.clusters.map((cluster, cIdx) => {
                        if (cIdx !== state.currentClusterIndex) return cluster;

                        return {
                            ...cluster,
                            topics: cluster.topics.map(t =>
                                t.day === day ? { ...t, isPublished: true, publishedAt: new Date().toISOString() } : t
                            )
                        };
                    });

                    // Advance pointer
                    let nextTopicIdx = state.currentTopicIndex + 1;
                    let nextClusterIdx = state.currentClusterIndex;

                    if (nextTopicIdx >= 10) {
                        nextTopicIdx = 0;
                        nextClusterIdx = (state.currentClusterIndex + 1) % state.clusters.length;
                    }

                    return {
                        clusters: newClusters,
                        currentTopicIndex: nextTopicIdx,
                        currentClusterIndex: nextClusterIdx
                    };
                });
            },

            // [NEW] Manual Jump
            setCurrentTopic: (clusterIdx: number, topicIdx: number) => {
                set({ currentClusterIndex: clusterIdx, currentTopicIndex: topicIdx });
            },

            resetTopics: () => set({ clusters: [], currentClusterIndex: 0, currentTopicIndex: 0 })
        }),
        {
            name: 'antigravity-topic-storage',
        }
    )
);
