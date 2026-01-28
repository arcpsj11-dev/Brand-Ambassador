import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
// [CLEAN] Removed experiment store imports
import { useAdminStore } from '../store/useAdminStore';
import { useAuthStore } from '../store/useAuthStore';
import type { TopicCluster } from '../store/useTopicStore';
// Helper: A/B 테스트 활성 프롬프트 가져오기
// [CLEAN] Removed A/B testing helper `getActiveVariantPrompt` to ensure strict Admin Prompt adherence.

export interface ReasoningStep {
    id: string;
    label: string;
    description: string;
    status: 'pending' | 'processing' | 'completed';
}

export interface ReasoningResponse {
    thoughtChain: ReasoningStep[];
    briefing: string;
    keywords: string[];
    recommendation: string;
}

export interface MonthlyTitleResponse {
    clusters: TopicCluster[];
}

const getGenAI = () => {
    const adminStore = useAdminStore.getState();
    const authUser = useAuthStore.getState().user;

    // Direct Key Access
    const adminKey = adminStore.geminiApiKey;
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    const finalKey = adminKey || envKey;

    if (!finalKey) {
        throw new Error("API_KEY_MISSING");
    }

    // Usage Limit Check
    if (authUser && authUser.role !== 'admin') {
        const adminUser = adminStore.users.find(u => u.id === authUser.id);
        const tierConfig = adminStore.tierConfigs[authUser.tier];

        if (adminUser && tierConfig) {
            if (adminUser.usageCount >= tierConfig.maxUsage) {
                throw new Error("USAGE_LIMIT_REACHED");
            }
        }
    }

    return new GoogleGenerativeAI(finalKey);
};

// [나노바나나] 의료법 및 포털 정책 준수 레이어 (절대 규칙)
// [CLEAN] Removed COMPLIANCE_LAYER. Prompts now strictly follow Admin Store templates.

// Schemas
const TOPIC_CLUSTER_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        clusters: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.STRING },
                    category: { type: SchemaType.STRING },
                    topics: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                day: { type: SchemaType.NUMBER },
                                type: { type: SchemaType.STRING },
                                title: { type: SchemaType.STRING },
                            },
                            required: ["day", "type", "title"]
                        }
                    }
                },
                required: ["id", "category", "topics"]
            }
        }
    },
    required: ["clusters"]
};

const KEYWORD_ANALYSIS_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        briefing: { type: SchemaType.STRING },
        keywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        recommendation: { type: SchemaType.STRING },
    },
    required: ["briefing", "keywords", "recommendation"]
};

const IMAGE_PROMPT_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        images: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    prompt: { type: SchemaType.STRING },
                    alt: { type: SchemaType.STRING },
                    recommendedPhotoKey: { type: SchemaType.STRING },
                },
                required: ["prompt", "alt"]
            }
        }
    },
    required: ["images"]
};

const COACHING_SCHEMA = {
    type: SchemaType.OBJECT,
    properties: {
        overallScore: { type: SchemaType.NUMBER },
        targetScore: { type: SchemaType.NUMBER },
        recommendations: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    category: { type: SchemaType.STRING },
                    issue: { type: SchemaType.STRING },
                    action: { type: SchemaType.STRING },
                    priority: { type: SchemaType.STRING, enum: ["critical", "high", "medium", "low"] },
                },
                required: ["category", "issue", "action", "priority"]
            }
        }
    },
    required: ["overallScore", "targetScore", "recommendations"]
};




// Helper: Robust JSON Parser
const cleanAndParseJSON = (text: string) => {
    try {
        // 1. Remove Code Blocks
        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // 2. Try Parsing
        return JSON.parse(clean);
    } catch (e) {
        console.warn("Standard JSON Parse Failed. Raw Text:", text);

        // 3. Fallback: Extract innermost JSON object or array
        const firstOpenBrace = text.indexOf('{');
        const firstOpenBracket = text.indexOf('[');
        let start = -1;
        let end = -1;

        // Determine if we should look for object or array
        if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
            start = firstOpenBrace;
            end = text.lastIndexOf('}');
        } else if (firstOpenBracket !== -1) {
            start = firstOpenBracket;
            end = text.lastIndexOf(']');
        }

        if (start !== -1 && end !== -1) {
            const jsonSubstring = text.substring(start, end + 1);
            try {
                return JSON.parse(jsonSubstring);
            } catch (innerE) {
                console.error("Extraction Parse Failed. Extracted:", jsonSubstring);
            }
        }
        throw e;
    }
};

export const geminiReasoningService = {
    // [나노바나나] 지능형 인텐트 분석
    async analyzeIntent(input: string): Promise<'analysis' | 'planner' | 'action' | 'chat'> {
        const lower = input.toLowerCase();
        if (lower.includes('분석') || lower.includes('키워드')) return 'analysis';
        if (lower.includes('플래너') || lower.includes('스케줄') || lower.includes('달력')) return 'planner';
        if (lower.includes('변경') || lower.includes('수정') || lower.includes('바꿔') || lower.includes('업데이트')) return 'action';
        return 'chat';
    },

    // [나노바나나] 중앙 제어 액션 생성 엔진
    async generateAction(input: string, context: { brand: any, planner: any }): Promise<{ type: string, payload: Record<string, any>, response: string }> {
        const lower = input.toLowerCase();

        if (lower.includes('전화번호') || lower.includes('번호')) {
            const match = input.match(/\d{2,3}-\d{3,4}-\d{4}/);
            const newPhone = match ? match[0] : (context.brand?.phoneNumber || '010-0000-0000');
            return {
                type: 'UPDATE_BRAND',
                payload: { phoneNumber: newPhone },
                response: `원장님, 요청하신 대로 연락처를 ${newPhone}으로 변경 완료했습니다! 😎`
            };
        }

        if (lower.includes('주소')) {
            const newAddress = input.replace(/주소|변경|수정|바꿔|줘/g, '').trim();
            return {
                type: 'UPDATE_BRAND',
                payload: { address: newAddress || context.brand?.address || '김포시 운양동' },
                response: `알겠습니다 원장님! 주소 정보를 '${newAddress || context.brand?.address}'로 즉시 업데이트해 두었습니다. 🍌`
            };
        }

        if (lower.includes('카드') && (lower.includes('제목') || lower.includes('토픽'))) {
            const dayMatch = input.match(/(\d+)번|(\d+)일/);
            const day = dayMatch ? parseInt(dayMatch[1] || dayMatch[2]) : 1;
            const newTopic = input.split('제목')[1]?.replace(/으로|변경|수정|해줘|바꿔|줘/g, '').trim() || '새로운 마케팅 주제';
            return {
                type: 'UPDATE_PLANNER',
                payload: { day, topic: newTopic },
                response: `원장님, ${day}번 카드의 제목을 '${newTopic}'으로 직접 수정해 드렸어요! 이제 완벽하네요. ✨`
            };
        }

        return {
            type: 'UNKNOWN',
            payload: {},
            response: '죄송해요 원장님, 그 정보는 제가 직접 수정하기가 조금 어렵네요. 수동으로 변경해 주시겠어요? 💦'
        };
    },

    // [나노바나나] 실시간 스트리밍 대화 서비스 (TodayActionFlow용)
    async *generateStream(input: string, context: {
        clinicName: string;
        address: string;
        phoneNumber: string;
        pillarTitle?: string;
        equipment?: string;
        facilities?: string;
        extraPrompt?: string;
        blogIndex?: number;
        profile?: any;
    }) {
        try {
            const authUser = useAuthStore.getState().user;
            const genAI = getGenAI(); // Now checks usage limit

            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
            const adminState = useAdminStore.getState();

            // Increment usage count on successful start
            if (authUser && authUser.role !== 'admin') {
                await adminState.incrementUsage(authUser.id);
            }

            const activeOccupation = adminState.getActiveOccupation();
            const persona = activeOccupation.label;
            const bodyPrompt = activeOccupation.prompts.body;

            // [STRICT SYNC] Only use replaced template. No secret appendages.
            // [PROFILE CONTEXT] Build a detailed context from profile store
            const profile = context.profile || {};
            const profileInfo = `
[병원 프로파일 정보]
병원명: ${context.clinicName}
주소: ${context.address}
연락처: ${context.phoneNumber}
진료과목: ${(profile.subjects || []).join(', ')}
주요 타깃: ${profile.targetDemographic || '미지정'}
지역: ${profile.region || '미지정'}
핵심 주제: ${profile.mainTopic || '미지정'}
주요 키워드: ${(profile.keyKeywords || []).join(', ')}
피해야 할 주제: ${(profile.avoidTopics || []).join(', ')}
콘텐츠 톤: ${profile.contentTone || 'informative'}
원내 보유 사진 항목: ${Object.keys(profile.clinicPhotos || {}).join(', ')}
`;

            const prompt = bodyPrompt
                .replace(/{{title}}/g, input)
                .replace(/{{persona}}/g, persona)
                .replace(/{{pillarTitle}}/g, context.pillarTitle || '')
                .replace(/{{clinic_name}}|{{clinicName}}/g, context.clinicName)
                .replace(/{{address}}/g, context.address)
                .replace(/{{phoneNumber}}/g, context.phoneNumber)
                .replace(/{{region}}/g, profile.region || '지역')
                .replace(/{{topic}}/g, input)
                .replace(/{{target}}/g, profile.targetDemographic || '환자분들')
                .replace(/{{department}}/g, profile.mainTopic || '한방 진료')
                + `\n\n위 설정과 함께 아래 병원 프로파일 정보를 본문에 자연스럽게 녹여내어 신뢰감 있는 글을 작성해 주세요.\n${profileInfo}`
                + (context.extraPrompt ? `\n\n${context.extraPrompt}` : ''); // [NEW] Append dynamic prompt

            const result = await model.generateContentStream(prompt);
            for await (const chunk of result.stream) {
                yield chunk.text();
            }
        } catch (error) {
            console.error("Streaming Error:", error);
            yield "원장님, 엔진 점검이 필요한 것 같아요! 다시 시도해 주세요.";
        }
    },

    // [나노바나나] 키워드 전략 분석
    async analyzeKeywords(input: string, context: { city: string }): Promise<ReasoningResponse> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: KEYWORD_ANALYSIS_SCHEMA as any
                }
            });

            const prompt = `"${input}" 주제에 대해 김포 ${context.city} 지역 SEO 전략을 수립하세요.
            Result MUST be JSON:
            {
                "briefing": "Strategy summary in Jenny's tone",
                "keywords": ["15 keywords"],
                "recommendation": "1 main recommendation"
            }`;

            const result = await model.generateContent(prompt);
            const aiData = cleanAndParseJSON(result.response.text());

            return {
                thoughtChain: [
                    { id: '1', label: 'Analysis', description: 'Context and locality analyzed.', status: 'completed' }
                ],
                briefing: aiData.briefing,
                keywords: aiData.keywords,
                recommendation: aiData.recommendation
            };
        } catch (error) {
            console.error("Keyword Analysis Error:", error);
            throw error;
        }
    },

    // [나노바나나] 30일 마케팅 타이틀 벌크 생성
    async generateMonthlyTitles(topic: string): Promise<MonthlyTitleResponse> {
        try {
            const authUser = useAuthStore.getState().user;
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: TOPIC_CLUSTER_SCHEMA as any
                }
            });

            const adminState = useAdminStore.getState();

            if (authUser && authUser.role !== 'admin') {
                await adminState.incrementUsage(authUser.id);
            }

            const activeOccupation = adminState.getActiveOccupation();
            const titlePromptTemplate = activeOccupation.prompts.title;
            const persona = activeOccupation.label;

            const prompt = titlePromptTemplate
                .replace(/{{topic}}/g, topic)
                .replace(/{{persona}}/g, persona);

            // [나노바나나] 절대적인 구조 강제 (Admin 프롬프트에 이미 포함됨 - 중복 제거)
            // const structuralEnforcement = ... (Removed to strictly follow Admin Prompt)

            const finalPrompt = prompt;

            const result = await model.generateContent(finalPrompt);
            const data = cleanAndParseJSON(result.response.text());

            // [VALIDATION] Ensure exactly 3 clusters were generated
            if (!data.clusters || data.clusters.length !== 3) {
                console.error(`[generateMonthlyTitles] Expected 3 clusters, got ${data.clusters?.length || 0}`);
                console.error("AI Response:", data);
                throw new Error(`AI가 ${data.clusters?.length || 0}개의 클러스터만 생성했습니다. 3개가 필요합니다. 다시 시도해주세요.`);
            }

            // Verify each cluster has 10 topics
            for (let i = 0; i < data.clusters.length; i++) {
                const cluster = data.clusters[i];
                if (!cluster.topics || cluster.topics.length !== 10) {
                    console.error(`[generateMonthlyTitles] Cluster ${i + 1} has ${cluster.topics?.length || 0} topics, expected 10`);
                    throw new Error(`클러스터 ${i + 1}에 ${cluster.topics?.length || 0}개의 주제만 있습니다. 10개가 필요합니다.`);
                }
            }

            console.log(`[generateMonthlyTitles] Successfully generated 3 clusters with 30 topics total`);
            return data;
        } catch (error) {
            console.error("Bulk Title Error:", error);
            throw error;
        }
    },

    // [나노바나나] 이미지 프롬프트 및 ALT 추출/생성
    async generateImagePrompts(contentBody: string, profilePhotos?: string[]): Promise<Array<{ prompt: string, alt: string, recommendedPhotoKey?: string }>> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: IMAGE_PROMPT_SCHEMA as any
                }
            });

            const adminState = useAdminStore.getState();
            const activeOccupation = adminState.getActiveOccupation();
            const imagePromptTemplate = activeOccupation.prompts.image;

            const prompt = `${imagePromptTemplate} 

필요시 아래 병원 보유 사진 목록 중 가장 적합한 항목이 있다면 'recommendedPhotoKey'에 해당 키(예: desk, entrance 등)를 적어주세요.
병원 보유 사진 목록: ${profilePhotos?.join(', ') || '없음'}

[콘텐츠 본문 시작]
${contentBody}
[콘텐츠 본문 끝]`;

            const result = await model.generateContent(prompt);
            const data = cleanAndParseJSON(result.response.text());

            if (data.images && data.images.length > 0) {
                return data.images;
            }

            // Fallback
            return [{
                prompt: "Professional clinic room interior, clean and realistic medical photography",
                alt: "도담한의원 진료실 전경"
            }];
        } catch (error) {
            console.error("Image Prompt Error:", error);
            return [];
        }
    },

    // [나노바나나] 토픽 클러스터 생성 (Admin Title Prompt 동기화)
    async generateTopicCluster(keyword: string, persona?: { jobTitle: string; toneAndManner: string }): Promise<MonthlyTitleResponse> {
        try {
            const authUser = useAuthStore.getState().user;
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: TOPIC_CLUSTER_SCHEMA as any
                }
            });

            // Admin Store에서 'Monthly Titles' 프롬프트 가져오기
            const adminState = useAdminStore.getState();

            if (authUser && authUser.role !== 'admin') {
                await adminState.incrementUsage(authUser.id);
            }

            const activeOccupation = adminState.getActiveOccupation();
            const titlePromptTemplate = activeOccupation.prompts.title;
            const targetPersona = persona?.jobTitle || activeOccupation.label;

            // 프롬프트 바인딩 (Monthly Titles와 동일한 로직)
            const prompt = titlePromptTemplate
                .replace(/{{topic}}/g, keyword)
                .replace(/{{persona}}/g, targetPersona);



            const result = await model.generateContent(prompt);
            const data = cleanAndParseJSON(result.response.text()) as MonthlyTitleResponse;

            // [FALLBACK MECHANISM] If AI generates fewer than 3 clusters, generate more
            if (!data.clusters || data.clusters.length < 3) {
                console.warn(`[generateTopicCluster] AI generated ${data.clusters?.length || 0} clusters. Generating additional clusters...`);

                const allClusters = data.clusters || [];
                let startDay = allClusters.length > 0 ? allClusters[allClusters.length - 1].topics[allClusters[allClusters.length - 1].topics.length - 1].day + 1 : 1;

                // Generate remaining clusters one by one
                while (allClusters.length < 3) {
                    const clusterNumber = allClusters.length + 1;
                    const singleClusterPrompt = `Generate 1 topic cluster (10 topics: 1 pillar + 9 supporting) for "${keyword}".
                    
Cluster ID: "${clusterNumber}"
Start day number: ${startDay}
Category: Specific sub-theme ${clusterNumber} of "${keyword}" (e.g., for "교통사고 후유증": "근골격계 통증", "심리적 트라우마", "재활 치료")

Output JSON format:
{
  "clusters": [{
    "id": "${clusterNumber}",
    "category": "[Specific medical aspect of ${keyword}]",
    "topics": [
      {"day": ${startDay}, "type": "pillar", "title": "..."},
      {"day": ${startDay + 1}, "type": "supporting", "title": "..."},
      ... (total 10 topics)
    ]
  }]
}`;

                    const singleResult = await model.generateContent(singleClusterPrompt);
                    const singleData = cleanAndParseJSON(singleResult.response.text()) as MonthlyTitleResponse;

                    if (singleData.clusters && singleData.clusters.length > 0) {
                        allClusters.push(singleData.clusters[0]);
                        startDay += 10;
                        console.log(`[generateTopicCluster] Generated cluster ${clusterNumber}/3`);
                    } else {
                        throw new Error(`클러스터 ${clusterNumber} 생성 실패`);
                    }
                }

                data.clusters = allClusters;
                console.log(`[generateTopicCluster] Successfully generated 3 clusters via fallback mechanism`);
            }

            // [TOPIC COUNT FALLBACK] Verify each cluster has 10 topics, regenerate if needed
            for (let i = 0; i < data.clusters.length; i++) {
                const cluster = data.clusters[i];
                if (!cluster.topics || cluster.topics.length !== 10) {
                    console.warn(`[generateTopicCluster] Cluster ${i + 1} has ${cluster.topics?.length || 0} topics (expected 10). Regenerating...`);

                    const startDay = (i * 10) + 1;
                    const clusterNumber = i + 1;

                    const singleClusterPrompt = `Generate Cluster ${clusterNumber} (10 topics: 1 pillar + 9 supporting) for "${keyword}".
                    
Cluster ID: "${clusterNumber}"
Start day number: ${startDay}
Category: Specific sub-theme ${clusterNumber} of "${keyword}"

Output JSON format (PURE JSON):
{
  "clusters": [{
    "id": "${clusterNumber}",
    "category": "[Specific medical aspect]",
    "topics": [
      {"day": ${startDay}, "type": "pillar", "title": "..."},
      {"day": ${startDay + 1}, "type": "supporting", "title": "..."},
      ... (generates exact 10 topics)
    ]
  }]
}`;

                    try {
                        const singleResult = await model.generateContent(singleClusterPrompt);
                        const singleData = cleanAndParseJSON(singleResult.response.text()) as MonthlyTitleResponse;

                        if (singleData.clusters && singleData.clusters.length > 0 && singleData.clusters[0].topics.length === 10) {
                            data.clusters[i] = singleData.clusters[0]; // Replace with valid cluster
                            console.log(`[generateTopicCluster] Successfully repaired Cluster ${i + 1}`);
                        } else {
                            throw new Error(`Failed to regenerate valid cluster ${i + 1}`);
                        }
                    } catch (retryError) {
                        console.error(`[generateTopicCluster] Failed to repair Cluster ${i + 1}:`, retryError);
                        // We will allow it to fail here if retry fails, or throw
                        throw new Error(`클러스터 ${i + 1} 생성 실패 (주제 개수 부족)`);
                    }
                }
            }

            console.log(`[generateTopicCluster] Successfully generated 3 clusters with 30 topics total`);
            return data; // Return full response (clusters array)
        } catch (error) {
            console.error("Cluster Gen Error (Synced):", error);
            throw error;
        }
    },

    // [나노바나나] 슬롯 기반 콘텐츠 생성
    async generateSlotContent(params: {
        topicIndex: number;
        pillarTitle: string;
        currentTitle: string;
        persona: { jobTitle: string; toneAndManner: string };
        clinicInfo?: { name: string; address: string; phone: string };
    }): Promise<{ title: string; body: string }> {
        try {
            const authUser = useAuthStore.getState().user;
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
            const adminState = useAdminStore.getState();

            if (authUser && authUser.role !== 'admin') {
                await adminState.incrementUsage(authUser.id);
            }

            const activeOccupation = adminState.getActiveOccupation();
            const bodyPromptTemplate = activeOccupation.prompts.body;
            const targetPersona = activeOccupation.label;

            // const isPillar = params.topicIndex === 1; // [CLEAN] Unused

            // [STRICT SYNC] Only use replaced template. No secret appendages.
            let finalPrompt = bodyPromptTemplate
                .replace(/{{title}}/g, params.currentTitle)
                .replace(/{{pillarTitle}}/g, params.pillarTitle)
                .replace(/{{persona}}/g, targetPersona || params.persona.jobTitle)
                .replace(/{{tone}}/g, params.persona.toneAndManner)
                .replace(/{{clinic_name}}|{{clinicName}}/g, params.clinicInfo?.name || '')
                .replace(/{{address}}/g, params.clinicInfo?.address || '')
                .replace(/{{phoneNumber}}/g, params.clinicInfo?.phone || '')
                .replace(/{{region}}/g, '지역') // Slot content doesn't have profile easy access here, using fallback
                .replace(/{{topic}}/g, params.currentTitle)
                .replace(/{{target}}/g, '환자분들')
                .replace(/{{department}}/g, '진료');

            const result = await model.generateContent(finalPrompt);
            return {
                title: params.currentTitle,
                body: result.response.text().trim()
            };
        } catch (error) {
            console.error("Slot Content Error:", error);
            throw error;
        }
    },

    // [나노바나나] 경쟁사 분석 기반 AI 코칭 생성
    async generateCompetitorCoaching(comparisonData: {
        keyword: string;
        myContent: { wordCount: number; imageCount: number; hasVideo: boolean; keywordFrequency: number };
        topAverage: { wordCount: number; imageCount: number; hasVideo: boolean; keywordFrequency: number; score: number };
        myScore: number;
    }): Promise<{
        overallScore: number;
        targetScore: number;
        recommendations: Array<{
            category: string;
            issue: string;
            action: string;
            priority: 'critical' | 'high' | 'medium' | 'low';
        }>;
    }> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: COACHING_SCHEMA as any
                }
            });

            const prompt = `당신은 네이버 블로그 SEO 전문가이자 AI 코칭 시스템입니다.

상황:
- 키워드: "${comparisonData.keyword}"
- 내 점수: ${comparisonData.myScore}점 vs 상위권: ${comparisonData.topAverage.score}점
- 내 콘텐츠: 글자수 ${comparisonData.myContent.wordCount}자, 이미지 ${comparisonData.myContent.imageCount}장, 영상 ${comparisonData.myContent.hasVideo ? 'O' : 'X'}, 키워드 ${comparisonData.myContent.keywordFrequency}회
- 상위권: 글자수 ${comparisonData.topAverage.wordCount}자, 이미지 ${comparisonData.topAverage.imageCount}장, 영상 ${comparisonData.topAverage.hasVideo ? 'O' : 'X'}, 키워드 ${comparisonData.topAverage.keywordFrequency}회

부족한 부분만 지적하여 구체적 행동 지침을 제공하세요.

JSON 형식:
{
  "overallScore": ${comparisonData.myScore},
  "targetScore": ${comparisonData.topAverage.score},
  "recommendations": [
    {"category": "분량|미디어|키워드", "issue": "문제점", "action": "구체적 지시", "priority": "critical|high|medium|low"}
  ]
}

우선순위: critical(20점 차이), high(10-19), medium(5-9), low(소폭).
최대 5개 항목만 출력하세요.`;

            const result = await model.generateContent(prompt);
            const data = cleanAndParseJSON(result.response.text());
            return data;
        } catch (error) {
            console.error("Competitor Coaching Error:", error);
            return {
                overallScore: comparisonData.myScore,
                targetScore: comparisonData.topAverage.score,
                recommendations: [
                    {
                        category: "분량",
                        issue: "상위권 대비 콘텐츠 분량이 부족합니다.",
                        action: "본문 내용을 심화하여 글자 수를 늘려주세요.",
                        priority: "high" as const
                    }
                ]
            };
        }
    }
};

