import { GoogleGenerativeAI } from "@google/generative-ai";

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

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

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
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const systemPrompt = `당신은 '도담한의원'의 수석 마케터이자 전문 의료 칼럼니스트 '제니(Jenny)'입니다.

[1. 글의 정체성 및 톤앤매너]
- 역할: 의료 전문가(90%) + 세련된 마케터(10%).
- 톤앤매너: 도담한의원 원장님이 환자에게 직접 상담하듯 따뜻하고 논리적인 말투.
- 가독성: 모바일 최적화 (한 문단 2~3줄 내외). 핵심 아이콘(🚨, ✅, 📍)만 최소 활용.

[2. SEO 전략]
- 필수 키워드: '김포 운양동 한의원', '교통사고 후유증', '도담한의원', '추나요법', '약침치료'.
- 서두 300자 내 키워드 배치 필수.

[3. 본문 작성 공식: A-READ V5]
- [A] 구체적 상황 제시, [R] 한의학적 해부학 소견, [E] 학회지/임상 데이터 인용, [A] 번호 나열 없는 서술형 솔루션, [D] 치유 회복 축복.

[4. 글의 흐름 및 시각화 가이드]
- 서술형 체제: 번호 나열(1, 2, 3...) 절대 금지. 전문가 칼럼 스타일로 작성.
- 이미지 앵커: 각 소제목(##) 아래 내용이 끝나는 지점에 [이미지: (여기에 들어갈 이미지의 상세 영문 프롬프트)]를 반드시 생성.
- 영문 프롬프트 규칙: Photorealistic, high quality, Cinematic lighting, Soft focus background, Clean and professional atmosphere 포함.

[5. 마무리 구성]
- Jennie's Pick: MZ세대 위트 팩트체크 한 문장 추가.
- 병원 정보: 도담한의원(031-988-1575), 운양동 광장프라자 311호.
- 해시태그: #김포운양동한의원 #도담한의원 등 5~8개 한 줄 나열.

---
Clinic info: ${context.clinicName} / ${context.address} / ${context.phoneNumber}`;

            const prompt = `${systemPrompt} \nUser Request: "${input}"`;
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
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `Generate 30 blog titles for medical clustering strategy based on "${topic}".
            1 Pillar + 9 Supporting per cluster, 3 clusters total. Tone: Professional yet catchy (MZ style).
            Result MUST be JSON with "clusters" array.`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Bulk Title Error:", error);
            throw error;
        }
    },

    // [나노바나나] 이미지 프롬프트 추출/생성
    async generateImagePrompts(contentBody: string): Promise<string[]> {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `Extract or generate high-quality image prompts from the content below.
            Rules:
            1. Language: English.
            2. Style: Photorealistic, high quality, Cinematic lighting, Soft focus background, Clean and professional atmosphere.
            3. Extract from [이미지: (prompt)] tags if they exist.
            Format: JSON { "prompts": [] }
            Content: ${contentBody.substring(0, 3000)}`;

            const result = await model.generateContent(prompt);
            const data = JSON.parse(result.response.text());
            return data.prompts || ["Clinic room photorealistic, high quality"];
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
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `Generate 1 Pillar and 9 Satellite blog titles for keyword "${keyword}".
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
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const isPillar = params.topicIndex === 1;

            const basePrompt = `당신은 '도담한의원' 원원장님으로서 블로그 글을 작성합니다.
주제(제목): "${params.currentTitle}"

[작성 지침]
- 톤앤매너: 따뜻하고 논리적인 서술형 칼럼 스타일. 번호 나열(1, 2, 3...)은 절대 사용하지 마세요.
- 가독성: 한 문단 2~3줄 내외.
- 이미지 앵커: 각 소제목(##) 아래 내용이 끝나는 지점에 [이미지: (영문 프롬프트)]를 삽입하세요.
- 영문 프롬프트: Photorealistic, high quality, Cinematic lighting, Soft focus background, Clean and professional atmosphere 필수 포함.
- 마무리 구성: Jennie's Pick (MZ 위트), 병원 정보(도담한의원 031-988-1575), 해시태그 5~8개.

${isPillar ? '필러 포스트: 포괄적이고 전문적인 가이드 작성.' : `서브 포스트: 필러 "${params.pillarTitle}"와 연결된 세부 주제.`}

출력형식: 제목과 본문을 그대로 작성 (JSON 아님).`;

            const result = await model.generateContent(basePrompt);
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

