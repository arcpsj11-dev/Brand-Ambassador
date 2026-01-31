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

    // Actions (Mostly compatible signatures)
    setClusters: (slotId: string | TopicCluster[], clusters?: TopicCluster[]) => Promise<void>;
    getNextTopic: (slotId?: string) => { topic: Topic; clusterId: string; pillarTitle?: string } | null;
    markAsPublished: (slotId: string | number, day?: number) => Promise<void>;
    setCurrentTopic: (slotId: string | number, clusterIdx: number | string, topicIdx?: number) => void;
<<<<<<< HEAD
=======
    updateTopicTitle: (slotId: string, clusterIdx: number, topicIdx: number, newTitle: string) => Promise<void>;
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
    resetTopics: (slotId?: string) => Promise<void>;
    clearAllTopics: () => void;
    getSlotData: (slotId: string) => { clusters: TopicCluster[]; currentClusterIndex: number; currentTopicIndex: number } | null;
    fetchTopics: (userId: string) => Promise<void>;
    syncWithSlot: (slot: BlogSlot) => void;
}

export const useTopicStore = create<TopicStoreState>()((set, get) => ({
    clusters: [],
    currentClusterIndex: 0,
    currentTopicIndex: 0,

    syncWithSlot: (slot: BlogSlot) => {
        set({
            clusters: slot.clusters || [],
            currentClusterIndex: slot.currentClusterIndex || 0,
            currentTopicIndex: slot.currentTopicIndex || 0
        });
    },

    setClusters: async (arg1, arg2) => {
        // Handle overloaded signature: (clusters) or (slotId, clusters)
        const clusters = Array.isArray(arg1) ? arg1 : (arg2 || []);
        // [FIX] Prioritize passed slotId, fallback to activeSlotId
        const targetSlotId = (typeof arg1 === 'string' ? arg1 : null) || useSlotStore.getState().activeSlotId;

        if (targetSlotId) {
            const firstCluster = clusters[0];
            const pillar = firstCluster?.topics.find(t => t.type === 'pillar');
            const satellites = firstCluster?.topics.filter(t => t.type === 'supporting') || [];

            await useSlotStore.getState().updateSlot(targetSlotId, {
                clusters,
                currentClusterIndex: 0,
                currentTopicIndex: 1,
                currentCluster: {
                    pillarTitle: pillar?.title || '',
                    satelliteTitles: satellites.map(s => s.title),
                    currentIndex: 2
                }
            });
        }

        // [FIX] Only update local state if we are modifying the CURRENTLY ACTIVE slot
        // This prevents overwriting the view when background updates happen for other slots
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (targetSlotId === activeSlotId) {
            set({
                clusters,
                currentClusterIndex: 0,
                currentTopicIndex: 1
            });
        }
    },

    getNextTopic: (_slotId?: string) => {
        const { clusters, currentClusterIndex, currentTopicIndex } = get();
        if (clusters.length === 0) return null;

        const currentCluster = clusters[currentClusterIndex];
        if (!currentCluster) return null;

        const topic = currentCluster.topics[currentTopicIndex];
        if (!topic) return null;

        const pillar = currentCluster.topics.find(t => t.type === 'pillar');

        return {
            topic,
            clusterId: currentCluster.id,
            pillarTitle: topic.type === 'supporting' ? pillar?.title : undefined
        };
    },

    getSlotData: (_slotId: string) => {
        // Since the store currently only holds the ACTIVE slot's topics
        // We return the current state. Most components only care about the active slot anyway.
        return {
            clusters: get().clusters,
            currentClusterIndex: get().currentClusterIndex,
            currentTopicIndex: get().currentTopicIndex
        };
    },

    markAsPublished: async (arg1: any, arg2?: any) => {
        // Handle signature: (day) or (slotId, day)
        const day = typeof arg1 === 'number' ? arg1 : arg2;
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

    setCurrentTopic: (arg1: any, arg2: any, arg3?: any) => {
        // Signature: (clusterIdx, topicIdx) or (slotId, clusterIdx, topicIdx)
        let clusterIdx: number;
        let topicIdx: number;
        if (typeof arg1 === 'string') {
            clusterIdx = arg2;
            topicIdx = arg3;
        } else {
            clusterIdx = arg1;
            topicIdx = arg2;
        }

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

<<<<<<< HEAD
=======
    updateTopicTitle: async (slotId: string, clusterIdx: number, topicIdx: number, newTitle: string) => {
        const { clusters } = get();
        const newClusters = [...clusters];
        const cluster = { ...newClusters[clusterIdx] };
        const topics = [...cluster.topics];
        const topic = { ...topics[topicIdx] };

        topic.title = newTitle;
        topics[topicIdx] = topic;
        cluster.topics = topics;
        newClusters[clusterIdx] = cluster;

        // 1. Update local store
        set({ clusters: newClusters });

        // 2. Update Slot Store (Persistent Zustand)
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (slotId === activeSlotId) {
            const currentClusterData = newClusters[clusterIdx];
            const pillar = currentClusterData?.topics.find(t => t.type === 'pillar');
            const satellites = currentClusterData?.topics.filter(t => t.type === 'supporting') || [];

            await useSlotStore.getState().updateSlot(slotId, {
                clusters: newClusters,
                currentCluster: {
                    pillarTitle: pillar?.title || '',
                    satelliteTitles: satellites.map(s => s.title),
                    currentIndex: get().currentTopicIndex + 1
                }
            });
        }

        // 3. Update DB (Supabase)
        // [IMPORTANT] We need the topic ID from DB if we want to update by ID
        // Since useTopicStore/useSlotStore often uses day-based logic,
        // we might need to fetch the ID or use filter in updateTopicTitleInDB
        const { updateTopicTitleInDB, getAllTopicsForSlot } = await import('../services/topicClusterService');

        // Find the topic record in DB to get its integer ID
        const allDbTopics = await getAllTopicsForSlot(slotId);
        // Map day_number. Topic 0 of cluster 0 is day 1, Topic 1 is day 2...
        const targetDay = (clusterIdx * 10) + topicIdx + 1;
        const targetRecord = allDbTopics.find(t => t.day_number === targetDay);

        if (targetRecord && targetRecord.id) {
            await updateTopicTitleInDB(targetRecord.id, newTitle);
        }
    },

>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
    resetTopics: async (slotId?: string) => {
        const activeSlotId = slotId || useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            await useSlotStore.getState().updateSlot(activeSlotId, {
                clusters: [],
                currentClusterIndex: 0,
                currentTopicIndex: 0
            });
        }
        set({ clusters: [], currentClusterIndex: 0, currentTopicIndex: 0 });
    },

    clearAllTopics: () => {
        set({ clusters: [], currentClusterIndex: 0, currentTopicIndex: 0 });
    },

    fetchTopics: async (_userId: string) => {
        const activeSlotId = useSlotStore.getState().activeSlotId;
        if (activeSlotId) {
            const slot = useSlotStore.getState().getSlotById(activeSlotId);
            if (slot) get().syncWithSlot(slot);
        }
    }
}));
