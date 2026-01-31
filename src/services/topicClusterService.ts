import { supabase } from '../lib/supabaseClient';
import type { TopicCluster } from '../store/useTopicStore';

export interface ContentClusterRow {
    id?: number;
    user_id: string;
    slot_id: string;
    cluster_group: number;
    content_type: 'pillar' | 'supporting';
    title: string;
    description?: string;
    day_number: number;
    status: boolean;
    generated_content?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Batch insert topics from TopicCluster array into content_clusters table
 * Converts the 3-cluster structure into sequential 1-30 day entries
 */
export async function batchInsertTopics(
    userId: string,
    slotId: string,
    clusters: TopicCluster[]
): Promise<{ success: boolean; error?: string; insertedCount?: number }> {
    try {
        const rows: Omit<ContentClusterRow, 'id' | 'created_at' | 'updated_at'>[] = [];
        let dayCounter = 1;

        // Convert clusters array to flat array of rows
        for (let clusterIdx = 0; clusterIdx < clusters.length; clusterIdx++) {
            const cluster = clusters[clusterIdx];
            const clusterGroup = clusterIdx + 1; // 1, 2, 3

            for (const topic of cluster.topics) {
                rows.push({
                    user_id: userId,
                    slot_id: slotId,
                    cluster_group: clusterGroup,
                    content_type: topic.type,
                    title: topic.title,
                    description: topic.description,
                    day_number: dayCounter++,
                    status: false,
                    generated_content: undefined
                });
            }
        }

        // Insert all rows in batch
        const { data, error } = await supabase
            .from('content_clusters')
            .insert(rows)
            .select();

        if (error) {
            console.error('[topicClusterService] Batch insert failed:', error);
            return { success: false, error: error.message };
        }

        console.log(`[topicClusterService] Successfully inserted ${data?.length || 0} topics`);
        return { success: true, insertedCount: data?.length || 0 };

    } catch (err) {
        console.error('[topicClusterService] Unexpected error:', err);
        return { success: false, error: String(err) };
    }
}

/**
 * Get the next unwritten topic (status = false) for a slot
 * Returns the topic details plus the next topic title for preview
 */
export async function getNextUnwrittenTopic(slotId: string): Promise<{
    current: ContentClusterRow | null;
    next: ContentClusterRow | null;
    pillarTitle?: string;
} | null> {
    try {
        // Get current topic (first unwritten)
        const { data: current, error: currentError } = await supabase
            .from('content_clusters')
            .select('*')
            .eq('slot_id', slotId)
            .eq('status', false)
            .order('day_number', { ascending: true })
            .limit(1)
            .single();

        if (currentError || !current) {
            console.log('[topicClusterService] No unwritten topics found');
            return null;
        }

        // Get next topic (currentDayNumber + 1)
        const { data: next } = await supabase
            .from('content_clusters')
            .select('*')
            .eq('slot_id', slotId)
            .eq('day_number', current.day_number + 1)
            .single();

        // Get pillar title for current cluster (if current is supporting)
        let pillarTitle: string | undefined;
        if (current.content_type === 'supporting') {
            const { data: pillar } = await supabase
                .from('content_clusters')
                .select('title')
                .eq('slot_id', slotId)
                .eq('cluster_group', current.cluster_group)
                .eq('content_type', 'pillar')
                .single();
            pillarTitle = pillar?.title;
        }

        return {
            current,
            next: next || null,
            pillarTitle
        };

    } catch (err) {
        console.error('[topicClusterService] Error getting next topic:', err);
        return null;
    }
}

/**
 * Mark a topic as completed and store generated content
 */
export async function markTopicAsCompleted(
    topicId: number,
    generatedContent: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('content_clusters')
            .update({
                status: true,
                generated_content: generatedContent,
                updated_at: new Date().toISOString()
            })
            .eq('id', topicId);

        if (error) {
            console.error('[topicClusterService] Failed to mark topic as completed:', error);
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (err) {
        console.error('[topicClusterService] Unexpected error:', err);
        return { success: false, error: String(err) };
    }
}

/**
 * Get all topics for a slot (for displaying the 30-day list)
 */
export async function getAllTopicsForSlot(slotId: string): Promise<ContentClusterRow[]> {
    try {
        const { data, error } = await supabase
            .from('content_clusters')
            .select('*')
            .eq('slot_id', slotId)
            .order('day_number', { ascending: true });

        if (error) {
            console.error('[topicClusterService] Failed to fetch topics:', error);
            return [];
        }

        return data || [];

    } catch (err) {
        console.error('[topicClusterService] Unexpected error:', err);
        return [];
    }
}

/**
 * Delete all topics for a slot (used when resetting the plan)
 */
export async function deleteAllTopicsForSlot(slotId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('content_clusters')
            .delete()
            .eq('slot_id', slotId);

        if (error) {
            console.error('[topicClusterService] Failed to delete topics:', error);
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (err) {
        console.error('[topicClusterService] Unexpected error:', err);
        return { success: false, error: String(err) };
    }
}

/**
 * Get progress statistics for a slot
 */
export async function getSlotProgress(slotId: string): Promise<{
    total: number;
    completed: number;
    remaining: number;
    currentDay: number | null;
}> {
    try {
        const { data: all } = await supabase
            .from('content_clusters')
            .select('status, day_number')
            .eq('slot_id', slotId);

        if (!all || all.length === 0) {
            return { total: 0, completed: 0, remaining: 0, currentDay: null };
        }

<<<<<<< HEAD
        const completed = all.filter(t => t.status).length;
=======
        const completed = all.filter((t: any) => t.status).length;
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
        const total = all.length;
        const remaining = total - completed;

        // Find current day (first incomplete)
<<<<<<< HEAD
        const nextIncomplete = all.find(t => !t.status);
        const currentDay = nextIncomplete?.day_number || null;

        return { total, completed, remaining, currentDay };

=======
        const nextIncomplete = all.find((t: any) => !t.status);
        const currentDay = nextIncomplete?.day_number || null;

        return { total, completed, remaining, currentDay };
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
    } catch (err) {
        console.error('[topicClusterService] Error getting progress:', err);
        return { total: 0, completed: 0, remaining: 0, currentDay: null };
    }
}
<<<<<<< HEAD
=======

/**
 * Update a specific topic's title in the DB
 */
export async function updateTopicTitleInDB(
    topicId: number,
    newTitle: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('content_clusters')
            .update({
                title: newTitle,
                updated_at: new Date().toISOString()
            })
            .eq('id', topicId);

        if (error) {
            console.error('[topicClusterService] Failed to update topic title:', error);
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (err) {
        console.error('[topicClusterService] Unexpected error in updateTopicTitleInDB:', err);
        return { success: false, error: String(err) };
    }
}
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
