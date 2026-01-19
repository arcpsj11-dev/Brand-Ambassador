import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PromptSet {
    title: string;
    body: string;
    image: string;
    chat: string; // New chat prompt
}

export interface Occupation {
    id: string;
    label: string; // e.g. "한의사", "의사"
    prompts: PromptSet;
}

interface AdminSettings {
    geminiApiKey: string;
    nanoBananaApiKey: string;
    dallEApiKey: string;
    activeImageProvider: 'nano' | 'dalle';
    activeOccupationId: string;
    occupations: Record<string, Occupation>;

    // Mock User Management for Admin
    users: Array<{ id: string; tier: 'START' | 'GROW' | 'SCALE'; role: 'user' | 'admin' }>;

    // Membership Tier Configuration
    tierConfigs: Record<string, {
        maxSlots: number;
        durationRaw: string; // e.g., "1개월", "무제한"
        label: string;
    }>;
}

interface AdminState extends AdminSettings {
    setGeminiApiKey: (key: string) => void;
    setNanoBananaApiKey: (key: string) => void;
    setDallEApiKey: (key: string) => void;
    setActiveImageProvider: (provider: 'nano' | 'dalle') => void;
    setActiveOccupation: (id: string) => void;
    updateOccupationPrompt: (occupationId: string, type: keyof PromptSet, content: string) => void;
    addOccupation: (id: string, label: string) => void;

    updateTierConfig: (tierId: string, updates: Partial<{ maxSlots: number; durationRaw: string }>) => void;

    updateUserTier: (userId: string, tier: 'START' | 'GROW' | 'SCALE') => void;

    // Helper to get current active occupation
    getActiveOccupation: () => Occupation;
}

const DEFAULT_PROMPTS_ORIENTAL: PromptSet = {
    title: `Generate 30 blog titles for medical clustering strategy based on "{{topic}}".
1 Pillar + 9 Supporting per cluster, 3 clusters total. 
[CRITICAL TITLE FORMULA]: Every title MUST follow this formula: "[증상/상황] + 왜/어떻게/무엇을 + 설명/정리/이해/관점"
Tone: Professional yet catchy (MZ style).
Result MUST be JSON with "clusters" array.
JSON Format: { "clusters": [ { "id": "1", "category": "...", "topics": [ { "day": 1, "type": "pillar", "title": "..." } ] } ] }`,

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

    image: `Role: 블로그 콘텐츠 분석 및 이미지 프롬프트 생성 전문가
Task: 주어진 본문 내용을 분석하여, 블로그 포스팅에 포함되면 좋을 이미지를 3~5개 추출하고, 각 이미지에 대한 상세한 영문 프롬프트(prompt)와 키워드 포함 ALT 텍스트를 생성합니다.

Constraints:
1. 출력 언어: 모든 'prompt' 내용은 반드시 영어(English)로 작성되어야 합니다.
2. 이미지 스타일: 생성되는 이미지는 고품질의 사실적인 메디컬 스타일 혹은 깔끔하고 현대적인 클리닉 분위기를 반영해야 합니다.
3. 이미지 개수: 본문 내용에 따라 3개에서 5개 사이로 이미지를 추출합니다.
4. ALT 텍스트: 'alt' 속성에는 이미지 내용을 설명하는 한국어 키워드를 5개 이상 포함하여 SEO에 최적화합니다.

Output Format (JSON Only):
{
  "images": [
    {
      "prompt": "A photorealistic scene of a person in their 20s wearing office attire, gently holding their stiff neck with a tired expression, sitting at a modern desk with a laptop, morning light coming through the window, clean and realistic medical lifestyle photography.",
      "alt": "교통사고 후 목통증, 20대 직장인 통증, 출근 후 목 결림, 장시간 컴퓨터 사용, 어깨 통증, 일상 불편"
    }
  ]
}`,

    chat: `당신은 친절하고 전문적인 '한의사' 마케팅 파트너입니다. 
사용자의 질문에 대해 한의학적 지식과 병원 마케팅 관점을 결합하여 답변하세요.
말투는 정중하면서도 신뢰감 있게, "~입니다", "~하죠" 등의 해요체를 사용하세요.`
};

const DEFAULT_PROMPTS_DOCTOR: PromptSet = {
    title: `Generate 30 blog titles for medical clustering strategy based on "{{topic}}".
Focus on evidence-based medicine and clinical treatments.
[CRITICAL TITLE FORMULA]: "[Disease/Symptom] + Diagnosis/Treatment + Explanation"
Tone: Trustworthy, authoritative, yet accessible.
Result MUST be JSON with "clusters" array.
JSON Format: { "clusters": [ { "id": "1", "category": "...", "topics": [ { "day": 1, "type": "pillar", "title": "..." } ] } ] }`,

    body: `당신은 전문적인 '의사(전문의)' 원장 페르소나입니다. 
주제: "{{title}}"

[1. 구조 (SOAP 기반 변형)]
- Subjective: 환자의 주관적 증상 공감.
- Objective: 의학적 검사 및 소견 설명.
- Assessment: 진단 및 병태 생리 설명 (전문용어 + 쉬운 풀이).
- Plan: 치료 계획 및 생활 습관 교정.

[2. 스타일]
- 논리적이고 명확한 어조.
- 최신 의학 지견이나 통계 데이터 인용 선호.
- 신뢰감을 주는 전문적인 용어 사용 후 괄호로 쉽게 설명.

분량: 2000자 이상.`,

    image: `Analyze the content and generate 3-5 realistic medical illustration or clinical setting image prompts.
Output prompts in English.
JSON Format: { "images": [ { "prompt": "...", "alt": "..." } ] }`,

    chat: `당신은 냉철하고 정확한 '의사' 마케팅 파트너입니다.
사용자의 질문에 대해 의학적 근거와 데이터 중심으로 답변하세요.
전문성을 강조하며 명확한 해결책을 제시하는 것을 선호합니다.`
};

export const useAdminStore = create<AdminState>()(
    persist(
        (set, get) => ({
            geminiApiKey: '',
            nanoBananaApiKey: '',
            dallEApiKey: '',
            activeImageProvider: 'dalle', // Default to DALL-E as it's more standard
            activeOccupationId: 'oriental_doctor',

            occupations: {
                'oriental_doctor': {
                    id: 'oriental_doctor',
                    label: '한의사',
                    prompts: DEFAULT_PROMPTS_ORIENTAL
                },
                'doctor': {
                    id: 'doctor',
                    label: '의사',
                    prompts: DEFAULT_PROMPTS_DOCTOR
                }
            },

            users: [
                { id: 'user', tier: 'START', role: 'user' },
                { id: 'grow', tier: 'GROW', role: 'user' },
                { id: 'scale', tier: 'SCALE', role: 'user' },
                { id: 'admin', tier: 'SCALE', role: 'admin' },
            ],

            tierConfigs: {
                'START': { maxSlots: 1, durationRaw: '7일 체험', label: 'BASIC (START)' },
                'GROW': { maxSlots: 3, durationRaw: '30일', label: 'PRO (GROW)' },
                'SCALE': { maxSlots: 5, durationRaw: '30일', label: 'ULTRA (SCALE)' }
            },

            setGeminiApiKey: (key) => set({ geminiApiKey: key }),
            setNanoBananaApiKey: (key) => set({ nanoBananaApiKey: key }),
            setDallEApiKey: (key) => set({ dallEApiKey: key }),
            setActiveImageProvider: (provider) => set({ activeImageProvider: provider }),

            setActiveOccupation: (id) => set({ activeOccupationId: id }),

            addOccupation: (id, label) => set((state) => ({
                occupations: {
                    ...state.occupations,
                    [id]: {
                        id,
                        label,
                        prompts: { ...DEFAULT_PROMPTS_ORIENTAL } // Default shallow copy
                    }
                }
            })),

            updateTierConfig: (tierId, updates) => set((state) => ({
                tierConfigs: {
                    ...state.tierConfigs,
                    [tierId]: {
                        ...state.tierConfigs[tierId],
                        ...updates
                    }
                }
            })),

            updateOccupationPrompt: (occupationId, type, content) => set((state) => ({
                occupations: {
                    ...state.occupations,
                    [occupationId]: {
                        ...state.occupations[occupationId],
                        prompts: {
                            ...state.occupations[occupationId].prompts,
                            [type]: content
                        }
                    }
                }
            })),

            updateUserTier: (userId, tier) => set((state) => ({
                users: state.users.map(u => u.id === userId ? { ...u, tier } : u)
            })),

            getActiveOccupation: () => {
                const state = get();
                return state.occupations[state.activeOccupationId] || state.occupations['oriental_doctor'];
            }
        }),
        {
            name: 'jenny-admin-storage-v5', // Bump version to force re-hydration with new fields
            partialize: (state) => ({
                geminiApiKey: state.geminiApiKey,
                nanoBananaApiKey: state.nanoBananaApiKey,
                dallEApiKey: state.dallEApiKey,
                activeImageProvider: state.activeImageProvider,
                activeOccupationId: state.activeOccupationId,
                occupations: state.occupations,
                users: state.users,
                tierConfigs: state.tierConfigs
            }),
        }
    )
);

