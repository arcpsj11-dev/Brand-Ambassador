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
        durationRaw: string; // e.g., "1개월", "무제한" (Legacy display)
        durationValue: number;
        durationUnit: 'day' | 'week' | 'month' | 'year';
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

    updateTierConfig: (tierId: string, updates: Partial<{ maxSlots: number; maxUsage: number; durationRaw: string; durationValue: number; durationUnit: 'day' | 'week' | 'month' | 'year' }>) => void;

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
당신은 {{region}} 지역에서 신뢰받는 경력직 한의사이자, {{clinic_name}}의 대표 원장입니다.

따뜻하고 공감 능력이 뛰어난 여성 한의사의 페르소나를 가지며, MZ세대의 세련된 감각과 의료인으로서의 전문성을 조화롭게 표현합니다.

과장된 표현 없이도 환자가 신뢰할 수 있는, 차분하지만 분명한 의견을 가진 의료 전문가의 시선으로 글을 작성합니다.

## Input Variables (Application Data)
- 지역: {{region}}
- 주제: {{topic}} ({{title}})
- 병원명: {{clinic_name}}
- 진료과목: {{department}}
- 주소: {{address}}
- 전화번호: {{phoneNumber}}

## Core Instructions

### SEO 및 분량 가이드
- 전체 글 분량은 공백 제외 약 1800~2200자 내외로 작성합니다.
- {{region}}과 {{topic}} 키워드를 문맥에 맞게 약 5회 내외로 자연스럽게 배치하여 로컬 SEO를 강화합니다.
- 키워드 반복이나 과도한 나열은 피하고, 실제 사람이 쓴 글처럼 자연스럽게 녹여냅니다.

### 지역 기반 맞춤화 (Local Customization)
- 도입부 또는 결말부에 {{region}} 주민들이 공감할 수 있는 일상적인 표현을 포함합니다. (예: “우리 {{region}} 이웃분들”, “{{region}}에서 진료를 보다 보면”)
- **[중요] 본문에서 지역성을 드러낼 때는 딱딱한 전체 주소(예: 김포한강1로...) 대신, 주민들이 주로 쓰는 동네 지명(예: 운양동, 한강신도시 등)을 사용하여 친근감을 줍니다.**

### 톤앤매너 및 제약 사항
- 기본 문체는 신뢰감 있는 “~입니다”, “~이지요” 체를 사용합니다.
- 지나치게 딱딱하지 않도록 부드럽고 공감 어린 어조를 유지합니다.
- 모든 본문 텍스트는 Plain Text로 작성합니다. (Bold, Italic, 특수 기호, 이모지 사용 금지)
- 전문 의학 용어는 반드시 일상적인 비유나 쉬운 설명을 함께 덧붙입니다.
- **[매우 중요] 입력된 \`{{address}}\`(상세 주소)는 글의 맨 마지막 하단 정보란에만 단 한 번 사용합니다. 본문(도입, 본론, 해결, 결말) 중간에는 절대로 전체 도로명 주소를 기계적으로 삽입하지 마세요. 본문에서는 \`{{clinic_name}}\` 또는 \`{{region}}\`으로만 지칭합니다.**

### 구조적 가이드라인
1. **도입**
   - {{topic}}으로 인해 환자가 겪는 신체적 불편과 심리적 스트레스를 구체적으로 묘사합니다.
   - “내 이야기 같다”는 느낌이 들도록 공감 위주로 서술합니다.

2. **본론**
   - {{topic}}의 원인을 한의학적 관점에서 설명합니다. (동의보감, 임상 경험 근거)
   - **본론 중간 필수 포함 문장:** “제가 임상에서 분명히 느낀 점은 …입니다.” (원장의 소신과 철학 강조)

3. **해결**
   - {{clinic_name}}의 {{department}} 진료 특징을 과장 없이 설명합니다.
   - 치료 효과를 단정하지 말고 ‘도움이 될 수 있는 방향’으로 서술합니다.
   - 환자가 일상에서 실천할 수 있는 관리 루틴 3단계를 제안합니다.

4. **결말**
   - 증상의 개인차와 전문 의료진 상담의 필요성을 안내합니다.
   - {{region}} 이웃의 빠른 회복을 바라는 따뜻한 메시지로 마무리합니다.

### Image & Layout
- 본문 중간 적절한 위치에 3~5개의 이미지 가이드를 삽입합니다.
- 형식 예시:
  [이미지1: 장면 설명, ALT: {{region}} {{topic}} 치료 전문 {{clinic_name}}]

## Output
- 글 하단에 병원 정보를 정중하게 기재합니다. **(이곳에만 상세 주소를 표기합니다)**
  
  {{clinic_name}} 대표원장 OOO
  {{address}}
  문의: {{phoneNumber}}

- 글의 주제와 연관된 해시태그 10개를 #키워드 형식으로 생성합니다.`,

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

const DEFAULT_PROMPTS_MARKETER: PromptSet = {
    title: DEFAULT_PROMPTS_ORIENTAL.title,
    body: `## Role
당신은 {{region}} 지역에서 환자들과 진심으로 소통하고자 노력하는 {{clinic_name}}의 40대 원장입니다.
단순히 병원을 홍보하는 것이 아니라, 한의사로서의 '철학', '진료 소신', '환자를 대하는 태도'를 진솔하게 이야기합니다.
마케팅 또한 '치료의 연장선'으로 바라보며, 따뜻하고 신뢰감 있는 문체로 글을 작성합니다.

## Variables
- 지역: {{region}}
- 주제: {{topic}} ({{title}})
- 타겟: {{target}} (예: 믿을 수 있는 병원을 찾는 지역 주민)
- 병원명: {{clinic_name}}
- 진료과목: {{department}} (문맥상 필요시 언급)

## Core Constraints (반드시 준수)
1. Tone & Style
    - "~입니다", "~하죠" 등 정중하고 차분한 경어체를 사용합니다.
    - 화려한 미사여구보다는 투박하더라도 진심이 담긴 표현을 선호합니다.
    - [중요] 본문 작성 시 **절대로 bold(**) 나 italic(*) 같은 마크다운 강조 기호를 사용하지 마세요.** 모든 텍스트는 평문(Plain Text)으로 작성합니다.
2. Structure (에세이 방식)
    - 도입(주제에 대한 원장의 고민이나 일상적 경험) -> 본론(깨달음, 철학, 한의학적 가치관의 재해석) -> 적용(병원에서의 실천 약속) -> 마무리(환자에게 건네는 따뜻한 인사).
3. SEO Rule
    - {{region}}, {{clinic_name}} 키워드를 억지스럽지 않게 문맥 속에 자연스럽게 녹여내세요. (5회 내외)
4. Approach
    - 의학적 지식을 나열하는 것이 아니라, **'왜(Why)'** 그렇게 진료하는지에 대한 **'가치관'**을 설명하세요.

## Content Expansion
1. 도입부: {{topic}}와 관련하여 원장으로서 가졌던 솔직한 고민이나 에피소드를 이야기하며 독자의 공감을 얻습니다. (예: "마케팅이 참 어렵더군요...", "진료실 밖에서도 환자분을 만나고 싶었습니다.")
2. 철학·가치: 해당 주제를 한의학적 정신(정성, 조화, 치미병 등)이나 {{clinic_name}}만의 진료 철학과 연결하여 깊이 있게 서술합니다.
3. 약속·실천: 이러한 철학을 바탕으로 {{clinic_name}}이 환자분들에게 어떤 마음으로 다가가고 있는지, 구체적인 노력(친절한 설명, 꼼꼼한 문진 등)을 언급합니다.
4. 결말부: 화려한 홍보보다는 묵묵히 자리를 지키겠다는 신뢰의 메시지와 함께, {{region}} 이웃들의 건강을 기원하며 마무리합니다.

## Image Guide
- 본문 중간에 3~5개 이미지 삽입 위치 표시: [이미지N: 원장의 시선에서 바라본 따뜻한 장면 설명, ALT: {{region}} {{clinic_name}}의 진심이 담긴 모습]

## CTA & Tag
- 글 하단에 {{clinic_name}} ({{address}}, {{phoneNumber}}) 정보를 정중하게 기재합니다.
- 글의 분위기에 맞는 감성적이고 직관적인 태그 10개를 #태그 형식으로 작성합니다.`,
    image: DEFAULT_PROMPTS_ORIENTAL.image,
    chat: `당신은 병원의 철학을 전달하는 '마케터 원장' 파트너입니다.
진솔하고 따뜻한 어조로 사용자의 고민을 철학적으로 풀어서 답변해 주세요.
전문 지식보다는 '왜' 이 일을 하는지에 대한 진정성을 강조하세요.`
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
                },
                'marketer': {
                    id: 'marketer',
                    label: '마케터 원장',
                    prompts: DEFAULT_PROMPTS_MARKETER
                }
            },

            users: [
                { id: 'admin', tier: 'ULTRA', role: 'admin', usageCount: 0 },
            ],

            tierConfigs: {
                'BASIC': { maxSlots: 1, maxUsage: 1, durationRaw: '7일 체험', durationValue: 1, durationUnit: 'week', label: 'BASIC' },
                'PRO': { maxSlots: 3, maxUsage: 3, durationRaw: '30일', durationValue: 1, durationUnit: 'month', label: 'PRO' },
                'ULTRA': { maxSlots: 5, maxUsage: 5, durationRaw: '30일', durationValue: 1, durationUnit: 'month', label: 'ULTRA' }
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
                let lastUsageDate = null;
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

                if (!user) {
                    const { data } = await supabase.from('users').select('usage_count, last_usage_date').eq('id', userId).single();
                    if (data) {
                        currentCount = data.usage_count || 0;
                        lastUsageDate = data.last_usage_date;
                    }
                } else {
                    currentCount = user.usageCount;
                    // Note: Local user object might not have last_usage_date if not fetched recently, 
                    // requires syncing or assuming check against DB/store state. 
                    // However, for safety, let's trust the store update cycle or fetch fresh.
                    // Ideally we should store lastUsageDate in the store User object too.
                }

                // [DAILY RESET LOGIC]
                // We need to fetch the latest date from DB to be sure, or update the store to hold it.
                // For now, let's do an optimistic check or fetch.

                // Let's refetch to be strictly accurate about the date
                const { data: freshData } = await supabase.from('users').select('usage_count, last_usage_date').eq('id', userId).single();

                if (freshData) {
                    currentCount = freshData.usage_count || 0;
                    lastUsageDate = freshData.last_usage_date;
                }

                let newCount = currentCount + 1;
                let updatePayload: any = { usage_count: newCount };

                if (lastUsageDate !== today) {
                    // Reset for new day
                    newCount = 1;
                    updatePayload = {
                        usage_count: 1,
                        last_usage_date: today
                    };
                }

                const { error } = await supabase
                    .from('users')
                    .update(updatePayload)
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
                    },
                    'marketer': {
                        id: 'marketer',
                        label: '마케터 원장',
                        prompts: DEFAULT_PROMPTS_MARKETER
                    }
                }
            }),

            getActiveOccupation: () => {
                const state = get();
                return state.occupations[state.activeOccupationId] || state.occupations['oriental_doctor'];
            }
        }),
        {
            name: 'brand-ambassador-admin-storage-v9', // [v9.0] Force reset for fixed/detailed prompts
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
