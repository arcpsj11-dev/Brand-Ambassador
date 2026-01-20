import { GoogleGenerativeAI } from "@google/generative-ai";
import { useExperimentStore } from '../store/useExperimentStore';
import type { StepType } from '../store/useExperimentStore';
import { useAdminStore } from '../store/useAdminStore';
import type { TopicCluster } from '../store/useTopicStore';
// Helper: A/B ?ŒìŠ¤???œì„± ?„ë¡¬?„íŠ¸ ê°€?¸ì˜¤ê¸?
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

export interface MonthlyTitleResponse {
    clusters: TopicCluster[];
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

// [?˜ë…¸ë°”ë‚˜?? ?˜ë£Œë²?ë°??¬í„¸ ?•ì±… ì¤€???ˆì´??(?ˆë? ê·œì¹™)
const COMPLIANCE_LAYER = `
[?ˆë? ì¤€??ì¶œë ¥ ?œì•½ ì¡°ê±´]
- ë³?ì½˜í…ì¸ ëŠ” ?„ê¸°??ê´‘ê³ ê°€ ?„ë‹Œ '?•ë³´ ?œê³µ??ì½˜í…ì¸??¬ì•¼ ?©ë‹ˆ??
- '?´ëˆ?´ì‚°', '?¨ê³¼ ë³´ì¥', '?±ëŠ¥ ?•ì‹¤', 'ì¹˜ë£Œ ê²°ê³¼ ?¨ì •' ?±ì˜ ?œí˜„???ˆë? ?¬ìš©?˜ì? ë§ˆì„¸??
- ë³‘ì›ëª? ?„í™”ë²ˆí˜¸, ?•í™•???ì„¸ ì£¼ì†Œ??ë³¸ë¬¸ ì¤‘ê°„??ì§ì ‘ ê¸°ì¬?˜ì? ?ŠìŠµ?ˆë‹¤. (ë§ˆë¬´ë¦??ì—­?ë§Œ ?ˆìš©)
- ëª¨ë“  ì¹˜ë£Œ ?¨ê³¼??'?„ì????????ˆë‹¤', '?Œë³µ???•ëŠ” ëª©ì ', 'ê¸°ë??????ˆë‹¤' ???„ê³¡???œí˜„???¬ìš©?˜ì„¸??
- ?˜ë£Œë²?ë°??¤ì´ë²?ê²€???•ì±…???„ë°˜?˜ëŠ” ê³¼ì¥?˜ê±°???•ì •?ì¸ ?œí˜„?€ ?„ê²©??ê¸ˆì??©ë‹ˆ??
- ê¸€ êµ¬ì¡°??A-READ ë°©ì‹??? ì??˜ë˜, ?´ë?ì§€ ?„ì¹˜??[?´ë?ì§€: ?¤ëª…] ?•ì‹???°ë¦…?ˆë‹¤.
- ê¸€ ë§ë??ëŠ” ë°˜ë“œ??'?¤ìŒ ê¸€?ì„œ ?¤ë£° ì£¼ì œ'ë¥??ˆê³ ?˜ëŠ” ë¬¸ë‹¨???¬í•¨?˜ì„¸??
`;

export const geminiReasoningService = {
    // [?˜ë…¸ë°”ë‚˜?? ì§€?¥í˜• ?¸í…??ë¶„ì„
    async analyzeIntent(input: string): Promise<'analysis' | 'planner' | 'action' | 'chat'> {
        const lower = input.toLowerCase();
        if (lower.includes('ë¶„ì„') || lower.includes('?¤ì›Œ??)) return 'analysis';
        if (lower.includes('?Œë˜??) || lower.includes('?¤ì?ì¤?) || lower.includes('?¬ë ¥')) return 'planner';
        if (lower.includes('ë³€ê²?) || lower.includes('?˜ì •') || lower.includes('ë°”ê¿”') || lower.includes('?…ë°?´íŠ¸')) return 'action';
        return 'chat';
    },

    // [?˜ë…¸ë°”ë‚˜?? ì¤‘ì•™ ?œì–´ ?¡ì…˜ ?ì„± ?”ì§„
    async generateAction(input: string, context: { brand: any, planner: any }): Promise<{ type: string, payload: Record<string, any>, response: string }> {
        const lower = input.toLowerCase();

        if (lower.includes('?„í™”ë²ˆí˜¸') || lower.includes('ë²ˆí˜¸')) {
            const match = input.match(/\d{2,3}-\d{3,4}-\d{4}/);
            const newPhone = match ? match[0] : (context.brand?.phoneNumber || '010-0000-0000');
            return {
                type: 'UPDATE_BRAND',
                payload: { phoneNumber: newPhone },
                response: `?ì¥?? ?”ì²­?˜ì‹  ?€ë¡??°ë½ì²˜ë? ${newPhone}?¼ë¡œ ë³€ê²??„ë£Œ?ˆìŠµ?ˆë‹¤! ?˜`
            };
        }

        if (lower.includes('ì£¼ì†Œ')) {
            const newAddress = input.replace(/ì£¼ì†Œ|ë³€ê²??˜ì •|ë°”ê¿”|ì¤?g, '').trim();
            return {
                type: 'UPDATE_BRAND',
                payload: { address: newAddress || context.brand?.address || 'ê¹€?¬ì‹œ ?´ì–‘?? },
                response: `?Œê² ?µë‹ˆ???ì¥?? ì£¼ì†Œ ?•ë³´ë¥?'${newAddress || context.brand?.address}'ë¡?ì¦‰ì‹œ ?…ë°?´íŠ¸???ì—ˆ?µë‹ˆ?? ?Œ`
            };
        }

        if (lower.includes('ì¹´ë“œ') && (lower.includes('?œëª©') || lower.includes('? í”½'))) {
            const dayMatch = input.match(/(\d+)ë²?(\d+)??);
            const day = dayMatch ? parseInt(dayMatch[1] || dayMatch[2]) : 1;
            const newTopic = input.split('?œëª©')[1]?.replace(/?¼ë¡œ|ë³€ê²??˜ì •|?´ì¤˜|ë°”ê¿”|ì¤?g, '').trim() || '?ˆë¡œ??ë§ˆì???ì£¼ì œ';
            return {
                type: 'UPDATE_PLANNER',
                payload: { day, topic: newTopic },
                response: `?ì¥?? ${day}ë²?ì¹´ë“œ???œëª©??'${newTopic}'?¼ë¡œ ì§ì ‘ ?˜ì •???œë ¸?´ìš”! ?´ì œ ?„ë²½?˜ë„¤?? ??
            };
        }

        return {
            type: 'UNKNOWN',
            payload: {},
            response: 'ì£„ì†¡?´ìš” ?ì¥?? ê·??•ë³´???œê? ì§ì ‘ ?˜ì •?˜ê¸°ê°€ ì¡°ê¸ˆ ?´ë µ?¤ìš”. ?˜ë™?¼ë¡œ ë³€ê²½í•´ ì£¼ì‹œê² ì–´?? ?’¦'
        };
    },

    // [?˜ë…¸ë°”ë‚˜?? ?¤ì‹œê°??¤íŠ¸ë¦¬ë° ?€???œë¹„??(TodayActionFlow??
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
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const adminState = useAdminStore.getState();
            const activeOccupation = adminState.getActiveOccupation();
            const persona = activeOccupation.label;
            const bodyPrompt = activeOccupation.prompts.body;

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
            yield "?ì¥?? ?”ì§„ ?ê????„ìš”??ê²?ê°™ì•„?? ?¤ì‹œ ?œë„??ì£¼ì„¸??";
        }
    },

    // [?˜ë…¸ë°”ë‚˜?? ?¤ì›Œ???„ëµ ë¶„ì„
    async analyzeKeywords(input: string, context: { city: string }): Promise<ReasoningResponse> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `"${input}" ì£¼ì œ???€??ê¹€??${context.city} ì§€??SEO ?„ëµ???˜ë¦½?˜ì„¸??
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

    // [?˜ë…¸ë°”ë‚˜?? 30??ë§ˆì????€?´í? ë²Œí¬ ?ì„±
    async generateMonthlyTitles(topic: string): Promise<MonthlyTitleResponse> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
                generationConfig: { responseMimeType: "application/json" }
            });

            const adminState = useAdminStore.getState();
            const activeOccupation = adminState.getActiveOccupation();
            const titlePromptTemplate = activeOccupation.prompts.title;
            const persona = activeOccupation.label;

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

    // [?˜ë…¸ë°”ë‚˜?? ?´ë?ì§€ ?„ë¡¬?„íŠ¸ ë°?ALT ì¶”ì¶œ/?ì„±
    async generateImagePrompts(contentBody: string): Promise<Array<{ prompt: string, alt: string }>> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
                generationConfig: { responseMimeType: "application/json" }
            });

            const adminState = useAdminStore.getState();
            const activeOccupation = adminState.getActiveOccupation();
            const imagePromptTemplate = activeOccupation.prompts.image;

            const prompt = `${imagePromptTemplate} \n\në³¸ë¬¸: ${contentBody.substring(0, 4000)}`;

            const result = await model.generateContent(prompt);
            const data = JSON.parse(result.response.text());

            if (data.images && data.images.length > 0) {
                return data.images;
            }

            // Fallback if no images found
            return [{
                prompt: "Professional clinic room, natural light, soft colors, realistic but friendly, warm professional photography",
                alt: "?„ë‹´?œì˜??ì§„ë£Œ???„ê²½"
            }];
        } catch (error) {
            console.error("Image Prompt Error:", error);
            return [];
        }
    },

    // [?˜ë…¸ë°”ë‚˜?? ? í”½ ?´ëŸ¬?¤í„° ?ì„± (Admin Title Prompt ?™ê¸°??
    async generateTopicCluster(keyword: string, persona?: { jobTitle: string; toneAndManner: string }): Promise<MonthlyTitleResponse> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash-exp",
                generationConfig: { responseMimeType: "application/json" }
            });

            // Admin Store?ì„œ 'Monthly Titles' ?„ë¡¬?„íŠ¸ ê°€?¸ì˜¤ê¸?
            const adminState = useAdminStore.getState();
            const activeOccupation = adminState.getActiveOccupation();
            const titlePromptTemplate = activeOccupation.prompts.title;
            const targetPersona = persona?.jobTitle || activeOccupation.label;

            // ?„ë¡¬?„íŠ¸ ë°”ì¸??(Monthly Titles?€ ?™ì¼??ë¡œì§)
            const prompt = titlePromptTemplate
                .replace(/{{topic}}/g, keyword)
                .replace(/{{persona}}/g, targetPersona);

            // console.log("Using Synced Admin Prompt for Cluster:", prompt);

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(jsonStr) as MonthlyTitleResponse;

            return data; // Return full response (clusters array)
        } catch (error) {
            console.error("Cluster Gen Error (Synced):", error);
            throw error;
        }
    },

    // [?˜ë…¸ë°”ë‚˜?? ?¬ë¡¯ ê¸°ë°˜ ì½˜í…ì¸??ì„±
    async generateSlotContent(params: {
        topicIndex: number;
        pillarTitle: string;
        currentTitle: string;
        persona: { jobTitle: string; toneAndManner: string };
        clinicInfo?: { name: string; address: string; phone: string };
    }): Promise<{ title: string; body: string }> {
        try {
            const genAI = getGenAI();
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const adminState = useAdminStore.getState();
            const activeOccupation = adminState.getActiveOccupation();
            const bodyPromptTemplate = activeOccupation.prompts.body;
            const targetPersona = activeOccupation.label;

            const isPillar = params.topicIndex === 1;

            let finalPrompt = bodyPromptTemplate
                .replace(/{{title}}/g, params.currentTitle)
                .replace(/{{pillarTitle}}/g, params.pillarTitle)
                .replace(/{{persona}}/g, targetPersona || params.persona.jobTitle)
                .replace(/{{tone}}/g, params.persona.toneAndManner);

            finalPrompt += `\n\n${isPillar ? '?„ëŸ¬ ?¬ìŠ¤?? ì£¼ì œë¥?ì´ê´„?˜ëŠ” ?„ë¬¸?ì¸ ê¸°ë‘¥ ì½˜í…ì¸?' : `?œë¸Œ ?¬ìŠ¤?? "${params.pillarTitle}"???¹ì • ?´ìš©???¬í™”??ì½˜í…ì¸?`}`;

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

    // [?˜ë…¸ë°”ë‚˜?? ê²½ìŸ??ë¶„ì„ ê¸°ë°˜ AI ì½”ì¹­ ?ì„±
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
                model: "gemini-2.0-flash-exp",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `?¹ì‹ ?€ ?¤ì´ë²?ë¸”ë¡œê·?SEO ?„ë¬¸ê°€?´ì AI ì½”ì¹­ ?œìŠ¤?œì…?ˆë‹¤.

?í™©:
- ?¤ì›Œ?? "${comparisonData.keyword}"
- ???ìˆ˜: ${comparisonData.myScore}??vs ?ìœ„ê¶? ${comparisonData.topAverage.score}??
- ??ì½˜í…ì¸? ê¸€?ìˆ˜ ${comparisonData.myContent.wordCount}?? ?´ë?ì§€ ${comparisonData.myContent.imageCount}?? ?ìƒ ${comparisonData.myContent.hasVideo ? 'O' : 'X'}, ?¤ì›Œ??${comparisonData.myContent.keywordFrequency}??
- ?ìœ„ê¶? ê¸€?ìˆ˜ ${comparisonData.topAverage.wordCount}?? ?´ë?ì§€ ${comparisonData.topAverage.imageCount}?? ?ìƒ ${comparisonData.topAverage.hasVideo ? 'O' : 'X'}, ?¤ì›Œ??${comparisonData.topAverage.keywordFrequency}??

ë¶€ì¡±í•œ ë¶€ë¶„ë§Œ ì§€?í•˜??êµ¬ì²´???‰ë™ ì§€ì¹¨ì„ ?œê³µ?˜ì„¸??

JSON ?•ì‹:
{
  "overallScore": ${comparisonData.myScore},
  "targetScore": ${comparisonData.topAverage.score},
  "recommendations": [
    {"category": "ë¶„ëŸ‰|ë¯¸ë””???¤ì›Œ??, "issue": "ë¬¸ì œ??, "action": "êµ¬ì²´??ì§€??, "priority": "critical|high|medium|low"}
  ]
}

?°ì„ ?œìœ„: critical(20??ì°¨ì´), high(10-19), medium(5-9), low(?Œí­).
ìµœë? 5ê°???ª©ë§?ì¶œë ¥?˜ì„¸??`;

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
                        category: "ë¶„ëŸ‰",
                        issue: "?ìœ„ê¶??€ë¹?ì½˜í…ì¸?ë¶„ëŸ‰??ë¶€ì¡±í•©?ˆë‹¤.",
                        action: "ë³¸ë¬¸ ?´ìš©???¬í™”?˜ì—¬ ê¸€???˜ë? ?˜ë ¤ì£¼ì„¸??",
                        priority: "high" as const
                    }
                ]
            };
        }
    }
};

