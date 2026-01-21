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
    naverClientId: string;
    naverClientSecret: string;
    activeImageProvider: 'nano' | 'dalle' | 'google' | 'gemini';
    activeOccupationId: string;
    occupations: Record<string, Occupation>;

    // Mock User Management for Admin
    users: Array<{ id: string; tier: 'BASIC' | 'PRO' | 'ULTRA'; role: 'user' | 'admin'; expiresAt?: string; autoAdjustment?: boolean }>;

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
    setNaverClientId: (id: string) => void;
    setNaverClientSecret: (secret: string) => void;
    setActiveImageProvider: (provider: 'nano' | 'dalle' | 'google' | 'gemini') => void;
    setActiveOccupation: (id: string) => void;
    updateOccupationPrompt: (occupationId: string, type: keyof PromptSet, content: string) => void;
    addOccupation: (id: string, label: string) => void;

    updateTierConfig: (tierId: string, updates: Partial<{ maxSlots: number; durationRaw: string }>) => void;

    updateUserTier: (userId: string, tier: 'BASIC' | 'PRO' | 'ULTRA') => void;
    updateUserMembership: (userId: string, updates: { expiresAt?: string; autoAdjustment?: boolean }) => void;

    // Helper to get current active occupation
    getActiveOccupation: () => Occupation;
}

const DEFAULT_PROMPTS_ORIENTAL: PromptSet = {
    title: `Generate 30 blog titles for medical clustering strategy based on "{{topic}}".
    
[Structure Rules]
- You MUST generate exactly 3 distinct clusters.
- Each cluster MUST contain 1 Pillar Post + 9 Supporting Posts.
- Total: 30 Topics (3 Clusters x 10 Topics).

[Category Naming Rules]
- The 'category' field must be a specific sub-theme of '{{topic}}'.
- EXTREMELY IMPORTANT: DO NOT use generic names like "Major Symptoms 1", "Cluster A", "Part 1", or "General Info".
- DO NOT use fixed example categories like "Major Symptoms", "Mental Health", or "Lifestyle Habits" UNLESS they are highly relevant to '{{topic}}'.
- Example Categories for 'Traffic Accident': "Musculoskeletal Pain", "Psychological Trauma", "Rehabilitation Process".

[Title Formula]
- Formula: "[증상/상황] + 왜/어떻게/무엇을 + 설명/정리/이해/관점"
- Tone: Professional yet catchy (MZ style).

Result MUST be JSON with "clusters" array.
JSON Format: { "clusters": [ { "id": "1", "category": "...", "topics": [ { "day": 1, "type": "pillar", "title": "..." } ] } ] }
[STRICT CONSTRAINT]: OUTPUT ONLY PURE JSON. NO MARKDOWN. NO CONVERSATIONAL TEXT. START WITH "{".`,

    body: `당신은 {{persona}} 원장 페르소나입니다. 
주제: "{{title}}"

[1. 콘텐츠 가이드라인]
- 주제에 맞는 전문적인 지식과 공감 위주로 작성하세요.
- 불필요한 서술은 제외하고 실질적인 정보를 제공합니다.
- 분량: 2000자 이상 필수 작성.

[2. 병원 정보]
- 병원명: {{clinicName}}
- 위치: {{address}}
- 연락처: {{phoneNumber}}

[3. 필수 준수 규칙 (의료법 및 포털 정책)]
- 본 콘텐츠는 '정보 제공형 콘텐츠'여야 합니다.
- '효과 보장', '성능 확실', '치료 결과 단정' 등의 표현을 절대 사용하지 마세요.
- 모든 치료 효과는 '도움이 될 수 있다', '회복을 돕는 목적' 등 완곡한 표현을 사용하세요.
- 과장되거나 확정적인 표현은 엄격히 금지합니다.
- 이미지 위치는 [이미지번호: 설명, ALT: 키워드] 형식을 따릅니다.
- 글 말미에는 '다음 글에서 다룰 주제'를 예고하십시오.`,

    image: `Role: 블로그 콘텐츠 분석 및 이미지 프롬프트 생성 전문가
Task: 주어진 본문 내용을 분석하여, 본문 속에 포함된 모든 \`[이미지번호: 설명, ALT: ...]\` 태그를 찾아내고, 각 태그의 '설명'과 'ALT' 내용을 바탕으로 영문 프롬프트와 키워드 ALT를 생성합니다.

Constraints:
1. 개수 일치: 본문 내에 있는 이미지 태그의 개수와 동일한 개수의 결과물을 생성해야 합니다. (예: 본문에 태그가 3개면 결과도 반드시 3개)
2. 내용 일치: 각 태그의 '설명' 부분을 영문 프롬프트(prompt)로 변환하고, 'ALT' 부분을 키워드 포함 ALT 텍스트로 변환합니다.
3. 출력 언어: 'prompt'는 반드시 영어(English)로 작성합니다.
4. ALT 텍스트: 'alt' 속성에는 한국어 키워드를 5개 이상 포함합니다.

Output Format (JSON Only):
{
  "images": [
    {
      "prompt": "English prompt based on the description in the tag",
      "alt": "Korean ALT text based on the tag"
    }
  ]
}`,

    chat: `당신은 친절하고 전문적인 '한의사' 마케팅 파트너입니다. 
사용자의 질문에 대해 한의학적 지식과 병원 마케팅 관점을 결합하여 답변하세요.
말투는 정중하면서도 신뢰감 있게, "~입니다", "~하죠" 등의 해요체를 사용하세요.`
};

const DEFAULT_PROMPTS_DOCTOR: PromptSet = {
    title: `Generate 30 blog titles for medical clustering strategy based on "{{topic}}".

[Structure Rules]
- You MUST generate exactly 3 distinct clusters.
- Each cluster MUST contain 1 Pillar Post + 9 Supporting Posts.
- Total: 30 Topics (3 Clusters x 10 Topics).

[Category Naming Rules]
- The 'category' field must be a specific sub-theme of '{{topic}}'.
- EXTREMELY IMPORTANT: DO NOT use generic names like "Major Symptoms 1", "Cluster A", "Part 1", or "General Info".

[Title Formula]
- Formula: "[Disease/Symptom] + Diagnosis/Treatment + Explanation"
- Tone: Trustworthy, authoritative, yet accessible.

Result MUST be JSON with "clusters" array.
JSON Format: { "clusters": [ { "id": "1", "category": "...", "topics": [ { "day": 1, "type": "pillar", "title": "..." } ] } ] }
[STRICT CONSTRAINT]: OUTPUT ONLY PURE JSON. NO MARKDOWN. NO CONVERSATIONAL TEXT. START WITH "{".`,

    body: `당신은 {{persona}} 원장 페르소나입니다. 
주제: "{{title}}"

[1. 구조 (SOAP 기반 변형)]
- Subjective: 환자의 주관적 증상 공감.
- Objective: 의학적 검사 및 소견 설명.
- Assessment: 진단 및 병태 생리 설명 (전문용어 + 쉬운 풀이).
- Plan: 치료 계획 (약물, 수술적 치료 등 의료진 판단 기반).
- 필수 정보: {{clinicName}} ({{address}}, {{phoneNumber}})

[2. 스타일]
- 논리적이고 명확한 어조.
- 최신 의학 지견 인용 선호.
- 전문적인 용어 사용 후 괄호로 쉽게 설명.
- 분량: 2000자 이상.

[3. 필수 준수 규칙]
- 본 콘텐츠는 '정보 제공형 콘텐츠'여야 합니다.
- '효과 보장', '성능 확실', '치료 결과 단정' 등의 표현을 절대 사용하지 마세요.
- 모든 치료 효과는 '도움이 될 수 있다', '개인에 따라 다를 수 있다' 등 완곡한 표현을 사용하세요.
- 이미지 위치는 [이미지번호: 설명, ALT: 키워드] 형식을 따릅니다.`,

    image: `Find all \`[이미지번호: description, ALT: ...]\` tags in the provided content body. 
Generate exactly the same number of image prompts as the number of tags found.
Each prompt should be in English and based on the description in the tag.
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
            naverClientId: '',
            naverClientSecret: '',
            activeImageProvider: 'google', // Using Google Imagen 4
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
                { id: 'user', tier: 'BASIC', role: 'user', autoAdjustment: true },
                { id: 'grow', tier: 'PRO', role: 'user', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), autoAdjustment: true },
                { id: 'scale', tier: 'ULTRA', role: 'user', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), autoAdjustment: true },
                { id: 'admin', tier: 'ULTRA', role: 'admin' },
            ],

            tierConfigs: {
                'BASIC': { maxSlots: 1, durationRaw: '7일 체험', label: 'BASIC' },
                'PRO': { maxSlots: 3, durationRaw: '30일', label: 'PRO' },
                'ULTRA': { maxSlots: 5, durationRaw: '30일', label: 'ULTRA' }
            },

            setGeminiApiKey: (key) => set({ geminiApiKey: key }),
            setNanoBananaApiKey: (key) => set({ nanoBananaApiKey: key }),
            setDallEApiKey: (key) => set({ dallEApiKey: key }),
            setNaverClientId: (id) => set({ naverClientId: id }),
            setNaverClientSecret: (secret) => set({ naverClientSecret: secret }),
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

            updateUserMembership: (userId, updates) => set((state) => ({
                users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u)
            })),

            getActiveOccupation: () => {
                const state = get();
                return state.occupations[state.activeOccupationId] || state.occupations['oriental_doctor'];
            }
        }),
        {
            name: 'jenny-admin-storage-v7', // [RESET] Bump version to clear potential zombie prompts
            partialize: (state) => ({
                geminiApiKey: state.geminiApiKey,
                nanoBananaApiKey: state.nanoBananaApiKey,
                dallEApiKey: state.dallEApiKey,
                activeImageProvider: state.activeImageProvider,
                activeOccupationId: state.activeOccupationId,
                occupations: state.occupations,
                users: state.users,
                tierConfigs: state.tierConfigs,
                naverClientId: state.naverClientId,
                naverClientSecret: state.naverClientSecret
            }),
        }
    )
);
