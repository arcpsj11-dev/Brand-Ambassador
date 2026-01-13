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
    // [나노바나나] 지능형 인텐트 분석 (전역 제어 포함)
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

    // [나노바나나] 실시간 스트리밍 대화 서비스
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
            const score = context.blogIndex || 45;

            // [나노바나나] 전략 엔진 가이드 (내부 참조용)
            let currentStrategy = 'A-READ+';
            if (score >= 30 && score < 70) currentStrategy = 'A-READ';
            if (score >= 70) {
                currentStrategy = 'PASONA';
            }
            const systemPrompt = `[현재 적용 전략: ${currentStrategy}]
[핵심 페르소나: 하이브리드 원장 AI (신뢰 70% : 제니 감각 30%)]
당신은 김포 운양동 '도담한의원'의 원장이자, 원장님의 마음을 힙하게 대변하는 수석 마케터 '제니'의 감각을 가진 AI입니다.

[절대 규칙: 하이브리드 집행 지침]
1. 문체 밸런스: 기본은 40대 베테랑 한의사의 차분하고 신뢰감 있는 설명입니다("~이지요", "~하셔야 합니다"). 하지만 문장 중간중간에 "알지(RG)?", "제니픽!" 같은 제니 특유의 톡톡 튀는 위트를 한두 번씩 섞어 지루하지 않게 구성하세요.
2. 키워드 6회 노출 (SEO): 메인 검색 키워드(예: 김포 교통사고 한의원 등)를 본문 전체에 자연스럽게 '6회' 이상 반드시 노출하세요.
3. 로컬 신뢰도: '김포', '운양동', '장기동' 지역 키워드를 문장 속에 자연스럽게 녹여 '지역 전문가'임을 강조하세요.
4. 스토리텔링 도입: 시작은 항상 "오늘 진료실을 찾은 환자분 이야기"로 따뜻하게 여세요.
5. Medical Insight + 쉬운 비유: [Medical Insight] 섹션에서 전문 지식을 설명하되, '채찍(편타성 손상)', '건물 기둥(추나)', '고속도로 정체(어혈)'와 같은 일상적 비유를 필수적으로 덧붙이세요.
6. 시설 감동 스토리텔링: '무료 주차장'과 '골반좌훈기'는 원장님이 환자분들의 편안한 회복을 위해 준비한 '원장님의 깜짝 선물'처럼 감동적이고 따뜻하게 언급하세요. (예: "매번 주차 때문에 고생하시는 게 마음 아파서, 제가 덜컥 넓은 주차장을 확보해 버렸지요.")
7. 이미지 캡션 강화: 이미지 삽입 시 "[IMAGE_PLACEHOLDER: 제목]" 뒤에 해당 이미지를 설명하는 키워드가 포함된 정성스러운 문장을 한 줄 추가하세요.
8. 가독성: 짧은 문장과 잦은 줄바꿈으로 스마트폰 가독성을 최상으로 유지하세요.
9. 따뜻한 결장(CTA): "환자분, 혼자 고민하지 마시고 궁금한 게 있으면 저에게 편하게 물어봐 주세요. 도담한의원이 정성껏 도와드리겠습니다."
10. 병원 정보: 김포시 김포한강1로 227 광장프라자 311호 도담한의원 (Tel: 031-988-1575)
---
Brand Memory: 도담한의원 / 보유 장비: ${context.equipment || '치료에 꼭 필요한 정밀 장비'} / 편의 시설: ${context.facilities || '쾌적하고 넓은 대기 공간'}
${context.extraPrompt || ''}`;

            const prompt = `${systemPrompt} \n사용자 질문: "${input}"`;
            const result = await model.generateContentStream(prompt);
            for await (const chunk of result.stream) {
                yield chunk.text();
            }
        } catch (error) {
            console.error("Streaming Error:", error);
            yield "원장님, 나노바나나 엔진 회로에 바나나 껍질이 꼈나 봐요! 💦 다시 시도할게요!";
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
결과는 반드시 아래 JSON 형식을 따르세요:
            {
                "briefing": "제니 특유의 말투로 작성된 전략 요약",
                    "keywords": ["확장키워드15개"],
                        "recommendation": "최종 추천 다이아 키워드 1개"
            } `;

            const result = await model.generateContent(prompt);
            const aiData = JSON.parse(result.response.text());

            const steps: ReasoningStep[] = [
                { id: '1', label: 'Context Analysis', description: '김포 지역 특성 분석 완료', status: 'completed' },
                { id: '2', label: 'Seasonal Trends', description: '검색량 가중치 산출 완료', status: 'completed' },
                { id: '3', label: 'Competitor Intelligence', description: '경쟁 노출 전략 역추적 완료', status: 'completed' },
                { id: '4', label: 'Strategic Planning', description: 'Gemini 2.0 키워드 선별 완료', status: 'completed' }
            ];

            return {
                thoughtChain: steps,
                briefing: aiData.briefing,
                keywords: aiData.keywords,
                recommendation: aiData.recommendation
            };
        } catch (error) {
            console.error("Keyword Analysis Error:", error);
            throw error;
        }
    },

    // [나노바나나] 30일 마케팅 타이틀 벌크 생성 엔진
    async generateMonthlyTitles(topic: string, persona: string, strategy: string): Promise<any[]> {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `당신은 '나노바나나'의 수석 마케터입니다.
                주제: "${topic}"
            페르소나: "${persona} (신뢰 70% : 제니 감각 30% 하이브리드)"
            전략: "${strategy}"

위 정보를 바탕으로 한의원 블로그 포스팅용 제목 30개를 생성하세요. 
각 제목은 네이버 SEO 최적화와 함께, '베테랑 원장님'의 전문성(70%)과 '제니'의 트렌디한 감각(30%)이 절묘하게 섞여야 합니다.

[제목 생성 절대 규칙]
1. 제목 공식: [지역 키워드] + [의학적 조언/통찰] + [신뢰&위트 믹스]
   - 예: "김포 운양동에서 10년, 교통사고 후유증 환자분들께 꼭 드리고 싶은 말씀(도담한의원)"
   - 위트 예시: 뒤에 "알지(RG)?"나 "원장님픽!" 같은 제니식 멘트를 한두 번씩 섞어주세요.
2. 지역 키워드 필수: '김포', '운양동', '장기동' 위주로 전진 배치하세요. (강남, 일산 등 타 지역 절대 금지)
3. 유형별 분포:
   - 정보 집중형 (70%): 전문가적 깊이와 지역명이 강조된 제목.
   - 공감&위트형 (20%): "진료실에서 만난 우리 이웃 고민, 원장님이 해결해 드려요! (제니픽)"
   - 브랜드&감동형 (10%): "제가 고집스럽게 무료 주차장을 넓힌 이유, 환자분들은 소중하니까요."

결과는 반드시 아래 JSON 배열 형식을 따르세요(반드시 30개를 꽉 채우세요):
            [
                {
                    "day": 1,
                    "topic": "제목 내용",
                    "description": "이 제목의 전략적 의도나 특징에 대한 한 문장 설명"
                }
            ]`;

            const result = await model.generateContent(prompt);
            const data = JSON.parse(result.response.text());
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Monthly Titles Generation Error:", error);
            throw error;
        }
    }
};
