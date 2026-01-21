import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 콘텐츠 톤 타입
export type ContentTone = 'informative' | 'authoritative' | 'consultative';

// 프로파일 상태 인터페이스
interface ProfileState {
    // 병원 기본 정보
    clinicName: string;
    subjects: string[];  // 진료과목 (복수 선택)
    targetDemographic: string;  // 타깃 (연령/성별)
    region: string;

    // 원장 전문 포지션
    keyKeywords: string[];  // 주력 키워드 (최대 3개)
    mainTopic: string;  // 핵심 주제
    avoidTopics: string[];  // 피하고 싶은 주제

    // 콘텐츠 톤 & 방향
    contentTone: ContentTone;
    allowAggressiveExpression: boolean;
    allowReviewMention: boolean;

    // 블로그 계정 관리
    blogAccounts: string[]; // 네이버 ID 목록
    selectedBlogId: string | null;

    // 병원 사진 (New)
    clinicPhotos: Record<string, string>; // key: section (entrance, desk, etc), value: url/description

    // 프로파일 완료 여부
    isProfileComplete: boolean;

    // Actions
    setProfile: (profile: Partial<ProfileState>) => void;
    setProfileComplete: (complete: boolean) => void;
    addBlogAccount: (naverId: string) => void;
    removeBlogAccount: (naverId: string) => void;
    selectBlogAccount: (naverId: string) => void;
    setSelectedBlogId: (blogId: string) => void;
    resetProfile: () => void;
}

// 초기 상태
const initialState = {
    clinicName: '',
    subjects: [],
    targetDemographic: '',
    region: '',
    keyKeywords: [],
    mainTopic: '',
    avoidTopics: [],
    contentTone: 'informative' as ContentTone,
    allowAggressiveExpression: false,
    allowReviewMention: false,
    blogAccounts: [],
    selectedBlogId: null,
    clinicPhotos: {},
    isProfileComplete: false,
};

export const useProfileStore = create<ProfileState>()(
    persist(
        (set) => ({
            ...initialState,

            setProfile: (profile) => set((state) => ({
                ...state,
                ...profile
            })),

            setProfileComplete: (complete) => set({
                isProfileComplete: complete
            }),

            addBlogAccount: (naverId) => set((state) => ({
                blogAccounts: state.blogAccounts.includes(naverId) ? state.blogAccounts : [...state.blogAccounts, naverId],
                selectedBlogId: state.selectedBlogId || naverId // 첫 등록 시 자동 선택
            })),

            removeBlogAccount: (naverId) => set((state) => ({
                blogAccounts: state.blogAccounts.filter(id => id !== naverId),
                selectedBlogId: state.selectedBlogId === naverId ? (state.blogAccounts.find(id => id !== naverId) || null) : state.selectedBlogId
            })),

            selectBlogAccount: (naverId) => set({ selectedBlogId: naverId }),
            setSelectedBlogId: (blogId: string) => set({ selectedBlogId: blogId }),

            resetProfile: () => set(initialState),
        }),
        {
            name: 'brand-ambassador-profile-storage',
        }
    )
);
