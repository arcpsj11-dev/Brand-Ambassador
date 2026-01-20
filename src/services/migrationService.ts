import { useSlotStore, type BlogSlot } from '../store/useSlotStore';
import { useProfileStore } from '../store/useProfileStore';
import { useTopicStore } from '../store/useTopicStore';

/**
 * 기존 단일 블로그 데이터를 슬롯 시스템으로 마이그레이션
 * 
 * 이 함수는 앱 로드 시 자동으로 실행되어 기존 사용자 데이터를
 * "슬롯 1"로 변환하여 데이터 손실 없이 새 시스템으로 전환합니다.
 */
export function migrateToSlotSystem(): boolean {
    const slotStore = useSlotStore.getState();
    const profileStore = useProfileStore.getState();
    const topicStore = useTopicStore.getState();

    // 이미 슬롯이 있으면 마이그레이션 불필요
    if (slotStore.slots.length > 0) {
        return false;
        return false;
    }

    // 기존 데이터가 없으면 마이그레이션 불필요
    if (!profileStore.isProfileComplete) {
        return false;
        return false;
    }



    try {
        // 기존 토픽 클러스터 데이터 추출
        const firstCluster = topicStore.clusters[0];
        const pillarTopic = firstCluster?.topics.find(t => t.type === 'pillar');
        const satelliteTopics = firstCluster?.topics.filter(t => t.type === 'supporting') || [];

        // 슬롯 1 생성
        const defaultSlot: Partial<BlogSlot> = {
            slotName: '메인 블로그',
            naverBlogId: profileStore.selectedBlogId || '',
            personaSetting: {
                jobTitle: '전문가',
                toneAndManner: profileStore.contentTone || '신뢰감 있는',
                expertise: profileStore.keyKeywords
            },
            currentCluster: {
                pillarTitle: pillarTopic?.title || '',
                satelliteTitles: satelliteTopics.map(t => t.title),
                currentIndex: topicStore.currentTopicIndex + 1 || 1
            },
            isActive: true
        };

        slotStore.createSlot(defaultSlot);



        return true;
    } catch (error) {
        console.error('[Migration] Failed to migrate data:', error);
        return false;
    }
}

/**
 * 마이그레이션 상태 확인
 */
export function checkMigrationStatus(): {
    needsMigration: boolean;
    hasSlots: boolean;
    hasLegacyData: boolean;
} {
    const slotStore = useSlotStore.getState();
    const profileStore = useProfileStore.getState();

    const hasSlots = slotStore.slots.length > 0;
    const hasLegacyData = profileStore.isProfileComplete;
    const needsMigration = !hasSlots && hasLegacyData;

    return {
        needsMigration,
        hasSlots,
        hasLegacyData
    };
}
