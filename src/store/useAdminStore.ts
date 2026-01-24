import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';

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
    users: Array<{
        id: string;
        tier: 'BASIC' | 'PRO' | 'ULTRA';
        role: 'user' | 'admin';
        expiresAt?: string;
        autoAdjustment?: boolean;
        usageCount: number; // Current usage
    }>;

    // Membership Tier Configuration
    tierConfigs: Record<string, {
        maxSlots: number;
        maxUsage: number; // Max AI generation count
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
    resetPrompts: () => void;

    updateTierConfig: (tierId: string, updates: Partial<{ maxSlots: number; maxUsage: number; durationRaw: string }>) => void;

    updateUserTier: (userId: string, tier: 'BASIC' | 'PRO' | 'ULTRA') => Promise<void>;
    updateUserMembership: (userId: string, updates: { expiresAt?: string; autoAdjustment?: boolean; usageCount?: number }) => Promise<void>;
    addUser: (userId: string) => Promise<void>;
    incrementUsage: (userId: string) => Promise<void>;
    fetchUserStats: (userId: string) => Promise<void>;
    fetchUsers: () => Promise<void>;
    fetchSettings: () => Promise<void>;
    saveSettings: () => Promise<void>;

    // Helper to get current active occupation
    getActiveOccupation: () => Occupation;
}

const DEFAULT_PROMPTS_ORIENTAL: PromptSet = {
    title: `You are a medical content strategist. Generate EXACTLY 3 topic clusters for "{{topic}}".

CRITICAL REQUIREMENTS:
1. Generate EXACTLY 3 clusters (no more, no less)
2. Each cluster MUST have EXACTLY 10 topics (1 pillar + 9 supporting)
3. Total output: 30 topics across 3 clusters

STRUCTURE TEMPLATE (FOLLOW EXACTLY):
{
  "clusters": [
    {
      "id": "1",
      "category": "[Specific Sub-Theme 1 of {{topic}}]",
      "topics": [
        {"day": 1, "type": "pillar", "title": "[Main pillar title for cluster 1]"},
        {"day": 2, "type": "supporting", "title": "[Supporting topic 1]"},
        {"day": 3, "type": "supporting", "title": "[Supporting topic 2]"},
        {"day": 4, "type": "supporting", "title": "[Supporting topic 3]"},
        {"day": 5, "type": "supporting", "title": "[Supporting topic 4]"},
        {"day": 6, "type": "supporting", "title": "[Supporting topic 5]"},
        {"day": 7, "type": "supporting", "title": "[Supporting topic 6]"},
        {"day": 8, "type": "supporting", "title": "[Supporting topic 7]"},
        {"day": 9, "type": "supporting", "title": "[Supporting topic 8]"},
        {"day": 10, "type": "supporting", "title": "[Supporting topic 9]"}
      ]
    },
    {
      "id": "2",
      "category": "[Specific Sub-Theme 2 of {{topic}}]",
      "topics": [
        {"day": 11, "type": "pillar", "title": "[Main pillar title for cluster 2]"},
        {"day": 12, "type": "supporting", "title": "[Supporting topic 1]"},
        {"day": 13, "type": "supporting", "title": "[Supporting topic 2]"},
        {"day": 14, "type": "supporting", "title": "[Supporting topic 3]"},
        {"day": 15, "type": "supporting", "title": "[Supporting topic 4]"},
        {"day": 16, "type": "supporting", "title": "[Supporting topic 5]"},
        {"day": 17, "type": "supporting", "title": "[Supporting topic 6]"},
        {"day": 18, "type": "supporting", "title": "[Supporting topic 7]"},
        {"day": 19, "type": "supporting", "title": "[Supporting topic 8]"},
        {"day": 20, "type": "supporting", "title": "[Supporting topic 9]"}
      ]
    },
    {
      "id": "3",
      "category": "[Specific Sub-Theme 3 of {{topic}}]",
      "topics": [
        {"day": 21, "type": "pillar", "title": "[Main pillar title for cluster 3]"},
        {"day": 22, "type": "supporting", "title": "[Supporting topic 1]"},
        {"day": 23, "type": "supporting", "title": "[Supporting topic 2]"},
        {"day": 24, "type": "supporting", "title": "[Supporting topic 3]"},
        {"day": 25, "type": "supporting", "title": "[Supporting topic 4]"},
        {"day": 26, "type": "supporting", "title": "[Supporting topic 5]"},
        {"day": 27, "type": "supporting", "title": "[Supporting topic 6]"},
        {"day": 28, "type": "supporting", "title": "[Supporting topic 7]"},
        {"day": 29, "type": "supporting", "title": "[Supporting topic 8]"},
        {"day": 30, "type": "supporting", "title": "[Supporting topic 9]"}
      ]
    }
  ]
}

CATEGORY NAMING:
- Use specific medical/treatment aspects of {{topic}}
- Example for "교통사고 후유증": "근골격계 통증", "심리적 트라우마", "재활 치료 과정"
- NO generic names like "Cluster 1", "Part A", "General Info"

TITLE FORMULA:
- Pattern: [증상/상황] + 왜/어떻게/무엇을 + 설명/정리/이해
- Tone: Professional yet engaging (MZ-friendly)
- Example: "교통사고 후 목 통증, 왜 생기고 어떻게 치료할까?"

OUTPUT RULES:
- Start with "{" (no markdown, no explanation)
- Pure JSON only
- Verify: clusters.length === 3 && each cluster has 10 topics`,

    body: `## Role
너는 {{region}} 지역 기반의 의료 마케팅 전문가이자,
MZ세대의 감성을 이해하지만 의료 신뢰도를 최우선으로 유지하는 전문 카피라이터 ‘제니’다.
논리적이고 근거 있는 정보 전달을 통해 {{clinic_name}}의 브랜드 가치와 전문성을 높이는 블로그 포스팅을 작성한다.

## Variables
- 지역: {{region}}
- 주제: {{topic}} ({{title}})
- 타겟: {{target}}
- 병원명: {{clinic_name}}
- 진료과목: {{department}}

## Core Constraints (반드시 준수)
1. **Tone & Format**
    - 광고성 표현 지양, 설명·정리·이해 중심의 신뢰형 문체 유지.
    - [중요] 본문 작성 시 **절대로 bold(**) 나 italic(*) 같은 마크다운 강조 기호를 사용하지 마세요.** 모든 텍스트는 평문(Plain Text)으로 작성합니다.
    - 유행어, 과도한 비유, 감탄사 사용 금지.
2. **Structure**
    - 도입(공감) -> 본론(정보·근거) -> 해결책(치료·자가관리) -> 결론(미래상·CTA)
3. **SEO Rule**
    - {{region}}, {{topic}}, {{department}} 등 필수 키워드를 문맥에 맞게 각 2~4회 자연스럽게 분산 배치.
4. **Professionalism**
    - 반드시 2개 이상의 학술적 근거(KCI, PubMed 등) 인용.
    - 연도, 저자, 학회지 명시 필수. 임상적 의미 연결 설명 포함.

## Content Expansion
1. 도입부: {{target}}이 일상에서 {{topic}}로 인해 겪는 구체적인 불편함 묘사.
2. 정보·근거: 의학적 원리 설명 및 학술 자료 기반 해석.
3. 해결책: {{clinic_name}}의 {{department}} 진료 접근 방식 설명 및 자가 관리 루틴 3단계 제안.
4. 결말부: 회복된 미래상 시각화 및 CTA.

## Image Guide
- 본문 중간에 3~5개 이미지 삽입 위치 표시: [이미지N: 장면 설명, ALT: {{region}} + {{topic}} 관련 핵심 키워드 5개 포함된 문장형]

## CTA & Tag
- 글 말미에 {{clinic_name}}의 위치와 연락처를 자연스럽게 안내.
- 다음 글 연재 예고 포함.
- 마지막에 관련 태그 10개를 #태그 형식으로 작성.`,

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
                { id: 'admin', tier: 'ULTRA', role: 'admin', usageCount: 0 },
            ],

            tierConfigs: {
                'BASIC': { maxSlots: 1, maxUsage: 1, durationRaw: '7일 체험', label: 'BASIC' },
                'PRO': { maxSlots: 3, maxUsage: 3, durationRaw: '30일', label: 'PRO' },
                'ULTRA': { maxSlots: 5, maxUsage: 5, durationRaw: '30일', label: 'ULTRA' }
            },

            setGeminiApiKey: (key: string) => {
                set({ geminiApiKey: key });
                get().saveSettings();
            },
            setNanoBananaApiKey: (key: string) => {
                set({ nanoBananaApiKey: key });
                get().saveSettings();
            },
            setDallEApiKey: (key: string) => {
                set({ dallEApiKey: key });
                get().saveSettings();
            },
            setNaverClientId: (id: string) => {
                set({ naverClientId: id });
                get().saveSettings();
            },
            setNaverClientSecret: (secret: string) => {
                set({ naverClientSecret: secret });
                get().saveSettings();
            },
            setActiveImageProvider: (provider: any) => {
                set({ activeImageProvider: provider });
                get().saveSettings();
            },

            setActiveOccupation: (id: string) => set({ activeOccupationId: id }),

            addOccupation: (id: string, label: string) => set((state: any) => ({
                occupations: {
                    ...state.occupations,
                    [id]: {
                        id,
                        label,
                        prompts: { ...DEFAULT_PROMPTS_ORIENTAL } // Default shallow copy
                    }
                }
            })),

            updateTierConfig: (tierId: string, updates: any) => set((state: any) => ({
                tierConfigs: {
                    ...state.tierConfigs,
                    [tierId]: {
                        ...state.tierConfigs[tierId as keyof typeof state.tierConfigs],
                        ...updates
                    }
                }
            })),

            updateOccupationPrompt: (occupationId: string, type: string, content: string) => set((state: any) => ({
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

            updateUserTier: async (userId: string, tier: 'BASIC' | 'PRO' | 'ULTRA') => {
                const { error } = await supabase
                    .from('users')
                    .update({ tier })
                    .eq('id', userId);

                if (!error) {
                    set((state) => ({
                        users: state.users.map(u => u.id === userId ? { ...u, tier } : u)
                    }));
                }
            },

            updateUserMembership: async (userId: string, updates: { expiresAt?: string; autoAdjustment?: boolean; usageCount?: number }) => {
                const dbUpdates: any = {};
                if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt;
                if (updates.autoAdjustment !== undefined) dbUpdates.auto_adjustment = updates.autoAdjustment;
                if (updates.usageCount !== undefined) dbUpdates.usage_count = updates.usageCount;

                const { error } = await supabase
                    .from('users')
                    .update(dbUpdates)
                    .eq('id', userId);

                if (!error) {
                    set((state) => ({
                        users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u)
                    }));
                }
            },

            addUser: async (userId: string) => {
                // Check locally first
                const { users } = get();
                if (users.some(u => u.id === userId)) return;

                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                const { error } = await supabase
                    .from('users')
                    .insert([{
                        id: userId,
                        pw: '1234', // Default for manual addition
                        tier: 'BASIC',
                        role: 'user',
                        auto_adjustment: true,
                        usage_count: 0,
                        expires_at: expiresAt
                    }]);

                if (!error) {
                    set((state) => ({
                        users: [
                            ...state.users,
                            {
                                id: userId,
                                tier: 'BASIC',
                                role: 'user',
                                autoAdjustment: true,
                                usageCount: 0,
                                expiresAt
                            }
                        ]
                    }));
                }
            },

            incrementUsage: async (userId: string) => {
                const { users } = get();
                let user = users.find(u => u.id === userId);

                let currentCount = 0;

                if (!user) {
                    const { data } = await supabase.from('users').select('usage_count').eq('id', userId).single();
                    if (data) currentCount = data.usage_count || 0;
                } else {
                    currentCount = user.usageCount;
                }

                const newCount = currentCount + 1;

                const { error } = await supabase
                    .from('users')
                    .update({ usage_count: newCount })
                    .eq('id', userId);

                if (!error) {
                    set((state) => ({
                        users: state.users.some(u => u.id === userId)
                            ? state.users.map(u => u.id === userId ? { ...u, usageCount: newCount } : u)
                            : [...state.users, { id: userId, usageCount: newCount } as any]
                    }));

                    const authStore = (await import('./useAuthStore')).useAuthStore;
                    const authUser = authStore.getState().user;
                    if (authUser && authUser.id === userId) {
                        authStore.setState({
                            user: { ...authUser, usageCount: newCount }
                        });
                    }
                }
            },

            fetchUserStats: async (userId: string) => {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (data && !error) {
                    const mappedUser = {
                        id: data.id,
                        tier: data.tier as 'BASIC' | 'PRO' | 'ULTRA',
                        role: data.role as 'user' | 'admin',
                        expiresAt: data.expires_at,
                        autoAdjustment: data.auto_adjustment,
                        usageCount: data.usage_count || 0
                    };

                    set((state) => ({
                        users: state.users.some(u => u.id === userId)
                            ? state.users.map(u => u.id === userId ? mappedUser : u)
                            : [...state.users, mappedUser]
                    }));

                    const authStore = (await import('./useAuthStore')).useAuthStore;
                    const authUser = authStore.getState().user;
                    if (authUser && authUser.id === userId) {
                        authStore.setState({
                            user: { ...authUser, usageCount: data.usage_count || 0 }
                        });
                    }
                }
            },

            fetchUsers: async () => {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (data && !error) {
                    set({
                        users: data.map(u => ({
                            id: u.id,
                            tier: u.tier as 'BASIC' | 'PRO' | 'ULTRA',
                            role: u.role as 'user' | 'admin',
                            expiresAt: u.expires_at,
                            autoAdjustment: u.auto_adjustment,
                            usageCount: u.usage_count || 0
                        }))
                    });
                }
            },

            fetchSettings: async () => {
                const { data, error } = await supabase
                    .from('admin_settings')
                    .select('*');

                if (data && !error) {
                    const settings: any = {};
                    data.forEach(item => {
                        settings[item.key] = item.value;
                    });

                    set({
                        geminiApiKey: settings.geminiApiKey || get().geminiApiKey,
                        naverClientId: settings.naverClientId || get().naverClientId,
                        naverClientSecret: settings.naverClientSecret || get().naverClientSecret,
                        dallEApiKey: settings.dallEApiKey || get().dallEApiKey,
                        nanoBananaApiKey: settings.nanoBananaApiKey || get().nanoBananaApiKey,
                        activeImageProvider: settings.activeImageProvider || get().activeImageProvider,
                        tierConfigs: settings.tierConfigs || get().tierConfigs
                    });
                }
            },

            saveSettings: async () => {
                const state = get();
                const settingsToSave = [
                    { key: 'geminiApiKey', value: state.geminiApiKey },
                    { key: 'naverClientId', value: state.naverClientId },
                    { key: 'naverClientSecret', value: state.naverClientSecret },
                    { key: 'dallEApiKey', value: state.dallEApiKey },
                    { key: 'nanoBananaApiKey', value: state.nanoBananaApiKey },
                    { key: 'activeImageProvider', value: state.activeImageProvider },
                    { key: 'tierConfigs', value: state.tierConfigs }
                ];

                for (const item of settingsToSave) {
                    await supabase
                        .from('admin_settings')
                        .upsert([{ key: item.key, value: item.value }], { onConflict: 'key' });
                }
            },

            resetPrompts: () => set({
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
                }
            }),

            getActiveOccupation: () => {
                const state = get();
                return state.occupations[state.activeOccupationId] || state.occupations['oriental_doctor'];
            }
        }),
        {
            name: 'brand-ambassador-admin-storage-v7', // [v8.5 Rename] Change to Brand Ambassador
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
