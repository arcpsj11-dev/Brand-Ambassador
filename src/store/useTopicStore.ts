import { create } from 'zustand';
import { useSlotStore, type BlogSlot } from './useSlotStore';

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
    syncWithSlot: (slot: BlogSlot) => void;
}

export const useTopicStore = create<TopicStoreState>()((set, get) => ({
    clusters: [],
    currentClusterIndex: 0,
    currentTopicIndex: 0,

    syncWithSlot: (slot: BlogSlot) => {
        console.log(`[useTopicStore] syncWithSlot called for ${slot.slotName} (${slot.slotId})`);
        console.log(`[useTopicStore] Clusters found: ${slot.clusters?.length || 0}`);

        set({
            clusters: slot.clusters || [],
            currentClusterIndex: slot.currentClusterIndex || 0,
            currentTopicIndex: slot.currentTopicIndex || 0
        });
        console.log(`[useTopicStore] Synced. Current clusters in store: ${slot.clusters?.length || 0}`);
    },

    setClusters: async (clusters) => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const firstCluster = clusters[0];
            const pillar = firstCluster?.topics.find(t => t.type === 'pillar');
            const satellites = firstCluster?.topics.filter(t => t.type === 'supporting') || [];

            await useSlotStore.getState().updateSlot(activeSlotId, {
                clusters,
                currentClusterIndex: 0,
                currentTopicIndex: 1,
                currentCluster: {
                    pillarTitle: pillar?.title || '',
                    satelliteTitles: satellites.map(s => s.title),
                    currentIndex: 2 // Starting from 2nd topic (Skip Pillar initially as per request)
                }
            });
        }

        set({
            clusters,
            currentClusterIndex: 0,
            currentTopicIndex: 1
        });
    },

    getNextTopic: () => {
        const { clusters, currentClusterIndex, currentTopicIndex } = get();
        if (clusters.length === 0) return null;

        const currentCluster = clusters[currentClusterIndex];
        if (!currentCluster) return null;

        if (!currentCluster.topics || !Array.isArray(currentCluster.topics)) {
            console.error("Malformed Cluster Data:", currentCluster);
            return null;
        }

        const topic = currentCluster.topics[currentTopicIndex];
        if (!topic) return null;

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

        let nextTopicIdx = currentTopicIndex + 1;
        let nextClusterIdx = currentClusterIndex;

        if (nextTopicIdx >= 10) {
            nextTopicIdx = 0;
            nextClusterIdx = (currentClusterIndex + 1) % clusters.length;
        }

        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const currentClusterData = newClusters[nextClusterIdx];
            const pillar = currentClusterData?.topics.find(t => t.type === 'pillar');
            const satellites = currentClusterData?.topics.filter(t => t.type === 'supporting') || [];

            await useSlotStore.getState().updateSlot(activeSlotId, {
                clusters: newClusters,
                currentTopicIndex: nextTopicIdx,
                currentClusterIndex: nextClusterIdx,
                currentCluster: {
                    pillarTitle: pillar?.title || '',
                    satelliteTitles: satellites.map(s => s.title),
                    currentIndex: nextTopicIdx + 1
                }
            });
        }

        set({
            clusters: newClusters,
            currentTopicIndex: nextTopicIdx,
            currentClusterIndex: nextClusterIdx
        });
    },

    setCurrentTopic: (clusterIdx: number, topicIdx: number) => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const currentClusterData = get().clusters[clusterIdx];
            const pillar = currentClusterData?.topics.find(t => t.type === 'pillar');
            const satellites = currentClusterData?.topics.filter(t => t.type === 'supporting') || [];

            useSlotStore.getState().updateSlot(activeSlotId, {
                currentClusterIndex: clusterIdx,
                currentTopicIndex: topicIdx,
                currentCluster: {
                    pillarTitle: pillar?.title || '',
                    satelliteTitles: satellites.map(s => s.title),
                    currentIndex: topicIdx + 1
                }
            });
        }
        set({ currentClusterIndex: clusterIdx, currentTopicIndex: topicIdx });
    },

    resetTopics: async () => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            await useSlotStore.getState().updateSlot(activeSlotId, {
                clusters: [],
                currentClusterIndex: 0,
                currentTopicIndex: 0
            });
        }
        set({ clusters: [], currentClusterIndex: 0, currentTopicIndex: 0 });
    },

    fetchTopics: async (_userId: string) => {
        // Now handled by useSlotStore.fetchSlots and syncWithSlot
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const slot = useSlotStore.getState().getSlotById(activeSlotId);
            if (slot) {
                get().syncWithSlot(slot);
            }
        }
    }
}));
