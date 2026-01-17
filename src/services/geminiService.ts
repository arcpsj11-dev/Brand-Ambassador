import { GoogleGenerativeAI } from "@google/generative-ai";
import { useExperimentStore } from '../store/useExperimentStore';
import type { StepType } from '../store/useExperimentStore';
import { useAdminStore } from '../store/useAdminStore';

// Helper: A/B 테스트 활성 프롬프트 가져오기
const getActiveVariantPrompt = (step: StepType): { prompt: string; variantId: string; experimentId: string } | null => {
    try {
        const { getActiveExperiment, incrementVariantUsage } = useExperimentStore.getState();
        const experiment = getActiveExperiment(step);

        if (experiment && experiment.variants.length > 0) {
            const activeVariants = experiment.variants.filter(v => v.isActive);
            if (activeVariants.length === 0) return null;

            const randomIndex = Math.floor(Math.random() * activeVariants.length);
            const selectedVariant = activeVariants[randomIndex];

            incrementVariantUsage(experiment.id, selectedVariant.id);

            return {
                prompt: selectedVariant.promptContent,
                variantId: selectedVariant.id,
                experimentId: experiment.id
            };
        }
    } catch (e) {
        console.warn("Experiment Store Access Failed:", e);
    }
    return null;
};

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

const getGenAI = () => {
    const adminKey = useAdminStore.getState().geminiApiKey;
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    const finalKey = adminKey || envKey;

    if (!finalKey) {
        throw new Error("API_KEY_MISSING");
    }
    return new GoogleGenerativeAI(finalKey);
};

// [나노바나나] 의료법 및 포털 정책 준수 레이어 (절대 규칙)
const COMPLIANCE_LAYER = `
[절대 준수 출력 제약 조건]
- 본 콘텐츠는 후기나 광고가 아닌 '정보 제공형 콘텐츠'여야 합니다.
- '내돈내산', '효과 보장', '성능 확실', '치료 결과 단정' 등의 표현을 절대 사용하지 마세요.
- 병원명, 전화번호, 정확한 상세 주소는 본문 중간에 직접 기재하지 않습니다. (마무리 영역에만 허용)
- 모든 치료 효과는 '도움이 될 수 있다', '회복을 돕는 목적', '기대할 수 있다' 등 완곡한 표현을 사용하세요.
- 의료법 및 네이버 검색 정책을 위반하는 과장되거나 확정적인 표현은 엄격히 금지합니다.
- 글 구조는 A-READ 방식을 유지하되, 이미지 위치는 [이미지: 설명] 형식을 따릅니다.
- 글 말미에는 반드시 '다음 글에서 다룰 주제'를 예고하는 문단을 포함하세요.
`;

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
    async generateAction(input: string, context: { brand: any, planner: any }): Promise<{ type: string, payload: any, response: string }> {
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
        equipment?: string;
        facilities?: string;
        extraPrompt?: string;
        blogIndex?: number
    }) {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const adminState = useAdminStore.getState();
            const persona = adminState.targetPersona;
            const bodyPrompt = adminState.prompts.body;

            const systemPrompt = bodyPrompt
                .replace(/{{title}}/g, input)
                .replace(/{{persona}}/g, persona);

            const prompt = `${systemPrompt} \n${COMPLIANCE_LAYER} \nClinic Info: ${context.clinicName} / ${context.address} / ${context.phoneNumber}`;

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
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `"${input}" 주제에 대해 김포 ${context.city} 지역 SEO 전략을 수립하세요.
            Result MUST be JSON:
            {
                "briefing": "Strategy summary in Jenny's tone",
                "keywords": ["15 keywords"],
                "recommendation": "1 main recommendation"
            }`;

            const result = await model.generateContent(prompt);
            const aiData = JSON.parse(result.response.text());

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
    async generateMonthlyTitles(topic: string): Promise<any> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const adminState = useAdminStore.getState();
            const titlePromptTemplate = adminState.prompts.title;
            const persona = adminState.targetPersona;

            const prompt = titlePromptTemplate
                .replace(/{{topic}}/g, topic)
                .replace(/{{persona}}/g, persona);

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Bulk Title Error:", error);
            throw error;
        }
    },

    // [나노바나나] 이미지 프롬프트 및 ALT 추출/생성
    async generateImagePrompts(contentBody: string): Promise<Array<{ prompt: string, alt: string }>> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const adminState = useAdminStore.getState();
            const imagePromptTemplate = adminState.prompts.image;

            const prompt = `${imagePromptTemplate} \n\n본문: ${contentBody.substring(0, 4000)}`;

            const result = await model.generateContent(prompt);
            const data = JSON.parse(result.response.text());

            if (data.images && data.images.length > 0) {
                return data.images;
            }

            // Fallback if no images found
            return [{
                prompt: "Professional clinic room, natural light, soft colors, realistic but friendly, warm professional photography",
                alt: "도담한의원 진료실 전경"
            }];
        } catch (error) {
            console.error("Image Prompt Error:", error);
            return [];
        }
    },

    // [나노바나나] 토픽 클러스터 생성
    async generateTopicCluster(keyword: string, persona?: { jobTitle: string; toneAndManner: string }): Promise<{
        pillarTitle: string;
        satelliteTitles: string[];
    }> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `Generate 1 Pillar and 9 Satellite blog titles for keyword "${keyword}".
            [CRITICAL TITLE FORMULA]: Every title MUST follow this formula: "[증상/상황] + 왜/어떻게/무엇을 + 설명/정리/이해/관점"
            Example: "운양동 교통사고 목통증, 왜 밤마다 심해질까? (설명)"
            Persona: ${persona?.jobTitle || 'Expert'}, Tone: ${persona?.toneAndManner || 'Professional'}.
            JSON Format: { "pillarTitle": "", "satelliteTitles": [] }`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            // Clean up potentially markdown formatted JSON
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr);
            return {
                pillarTitle: data.pillarTitle,
                satelliteTitles: data.satelliteTitles.slice(0, 9)
            };
        } catch (error) {
            console.error("Cluster Gen Error:", error);
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
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const adminState = useAdminStore.getState();
            const bodyPromptTemplate = adminState.prompts.body;
            const targetPersona = adminState.targetPersona;

            const isPillar = params.topicIndex === 1;

            let finalPrompt = bodyPromptTemplate
                .replace(/{{title}}/g, params.currentTitle)
                .replace(/{{pillarTitle}}/g, params.pillarTitle)
                .replace(/{{persona}}/g, targetPersona || params.persona.jobTitle)
                .replace(/{{tone}}/g, params.persona.toneAndManner);

            finalPrompt += `\n\n${isPillar ? '필러 포스트: 주제를 총괄하는 전문적인 기둥 콘텐츠.' : `서브 포스트: "${params.pillarTitle}"의 특정 내용을 심화한 콘텐츠.`}`;

            // A/B Test Injection (STEP4_BODY)
            // Note: STEP4_BODY is assumed to cover the main generation logic here.
            const variant = getActiveVariantPrompt('STEP4_BODY');
            if (variant) {
                // If variant exists, override the prompt.
                // We use simple placeholder replacement for context injection.
                // If the user's prompt is a full rewrite, they must include placeholders e.g. {{title}}
                // MVP: If no {{title}} is found in variant, we append context at the top.
                console.log(`[A/B Experiment] ${variant.experimentId} / Variant ${variant.variantId} Applied`);

                finalPrompt = variant.prompt
                    .replace(/{{title}}/g, params.currentTitle)
                    .replace(/{{pillarTitle}}/g, params.pillarTitle)
                    .replace(/{{persona}}/g, params.persona.jobTitle)
                    .replace(/{{tone}}/g, params.persona.toneAndManner);

                // Fallback: If replacement didn't happen (no placeholders), prepend context
                if (!finalPrompt.includes(params.currentTitle)) {
                    finalPrompt = `Subject: ${params.currentTitle}\n\n` + finalPrompt;
                }
            }

            finalPrompt += `\n\n${COMPLIANCE_LAYER}`;
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
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
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
            const data = JSON.parse(result.response.text());
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

