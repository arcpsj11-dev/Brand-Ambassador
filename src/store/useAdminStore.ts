import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TargetPersonaType = '한의사' | '의사' | '변호사' | '세무사' | '치과의사';

interface AdminSettings {
    geminiApiKey: string;
    targetPersona: TargetPersonaType;

    // Prompts
    prompts: {
        title: string;
        body: string;
        image: string;
    };
}

interface AdminState extends AdminSettings {
    setGeminiApiKey: (key: string) => void;
    setTargetPersona: (persona: TargetPersonaType) => void;
    updatePrompt: (type: 'title' | 'body' | 'image', content: string) => void;

    // Mock User Management for Admin
    users: Array<{ id: string; tier: 'START' | 'GROW' | 'SCALE'; role: 'user' | 'admin' }>;
    updateUserTier: (userId: string, tier: 'START' | 'GROW' | 'SCALE') => void;
}

const DEFAULT_PROMPTS = {
    title: `Generate 30 blog titles for medical clustering strategy based on "{{topic}}".
1 Pillar + 9 Supporting per cluster, 3 clusters total. 
[CRITICAL TITLE FORMULA]: Every title MUST follow this formula: "[증상/상황] + 왜/어떻게/무엇을 + 설명/정리/이해/관점"
Tone: Professional yet catchy (MZ style).
Result MUST be JSON with "clusters" array.`,

    body: `당신은 김포 운양동 '도담한의원' 원장 페르소나입니다. 
주제: "{{title}}"

[1. 섹션별 분량 및 구조 (A-READ)]
- Attention (200~300자): 20대 직장인 사례로 공감하며 시작.
- Relevance (400~500자): 손상 기전 및 어혈 등 후유증 원인 분석.
- Evidence (400~500자): 최소 2개 이상의 논문/연구 출처 명시(연도, 학회지 포함)하여 근거 제시.
- Action (500~600자): 맞춤 치료 + 아주 상세한 자가 관리 루틴 제시.
- Delight (350~400자): 긍정적 변화 묘사 및 Jennie's Pick.

[2. 키워드 및 제목 전략 (Strict)]
- 제목 공식: [증상/상황] + 왜/어떻게/무엇을 + 설명/정리/이해/관점
- 필수 키워드: 운양동, 교통사고, 교통사고 후유증, 목통증, 어깨통증, 추나요법, 약침치료, 한의원

[3. 시각화/가독성]
- 이미지: [이미지번호: 설명, ALT: 키워드 포함] 형식으로 3~5개 이상.

분량: 2000~2500자 필수 작성.`,

    image: `당신은 블로그 콘텐츠 분석 및 이미지 프롬프트 생성 전문가입니다.
주어진 본문 내용을 분석하여, 블로그 포스팅에 포함되면 좋을 이미지를 3~5개 추출하세요.
출력 언어: 프롬프트 내용(prompt)은 반드시 영어(English)로 작성하세요.
JSON Format: { "images": [ { "prompt": "...", "alt": "..." } ] }`
};

export const useAdminStore = create<AdminState>()(
    persist(
        (set) => ({
            geminiApiKey: '',
            targetPersona: '한의사',
            prompts: DEFAULT_PROMPTS,
            users: [
                { id: 'user', tier: 'START', role: 'user' },
                { id: 'grow', tier: 'GROW', role: 'user' },
                { id: 'scale', tier: 'SCALE', role: 'user' },
                { id: 'admin', tier: 'SCALE', role: 'admin' },
            ],

            setGeminiApiKey: (key) => set({ geminiApiKey: key }),
            setTargetPersona: (persona) => set({ targetPersona: persona }),
            updatePrompt: (type, content) => set((state) => ({
                prompts: { ...state.prompts, [type]: content }
            })),
            updateUserTier: (userId, tier) => set((state) => ({
                users: state.users.map(u => u.id === userId ? { ...u, tier } : u)
            }))
        }),
        {
            name: 'jenny-admin-storage',
        }
    )
);
