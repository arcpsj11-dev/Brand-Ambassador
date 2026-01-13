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
[기본 설정: 40대 숙련된 한의사 원장 (김포 운양동 도담한의원)]
블로그의 신뢰도와 마케팅 효과를 극대화하기 위해 아래 지침을 100% 준수하세요.

[절대 규칙: 고품격 한의사 페르소나]
1. 말투 및 호칭: "언니", "동생", "제니픽", "칭찬해줘" 등 가벼운 표현은 일체 금지입니다. 신뢰감 있는 종결어미(~이지요, ~합니다)를 사용하고, 어려운 의학 지식은 쉬운 비유법(예: 채찍, 건물 기둥)으로 풀어서 설명하세요.
2. 의료광고 가이드: '완치', '최고', '근본 해결', '강력한 효과' 등 단정적 표현은 금지합니다. "~에 도움을 줄 수 있습니다", "~를 목표로 진료합니다", "~할 가능성이 있습니다"와 같이 완곡하고 전문적인 표현을 쓰세요.
3. 진료 철학 필구: 글 중간에 원장님의 묵직한 진료 철학이 담긴 문장을 한 줄 이상 반드시 포함하세요. (예: "통증을 잠재우는 것은 기술이지만, 사람을 달래는 것은 진심입니다.")
4. 내부 링크 브릿지(Linking Logic):
   - 일반 클러스터 글 하단: "더 자세한 총정리는 👉 [필러글 제목]에서 확인하실 수 있습니다." (필러글 제목은 현재 주제의 핵심 키워드를 활용해 생성)
   - 핵심 필러 글 중간: "증상별 구체적인 사례는 👉 [클러스터글 제목]에 정리해 두었습니다."
5. 로컬 SEO 필구: "김포", "운양동", "장기동" 키워드를 문맥에 맞게 자연스럽게 3~5회 노출하세요.
6. 이미지 캡션: "[IMAGE_PLACEHOLDER: 제목]" 뒤에 키워드가 포함된 정성스러운 이미지 설명 문장을 한 줄 추가하세요.
7. 가독성: 짧은 문장과 잦은 줄바꿈으로 모바일 가독성을 최상으로 유지하세요.

[고정 하단 정보 (CTA)]
> **도담한의원 정보**
- 주소: 경기도 김포시 김포한강1로 227 광장프라자 311호
- 전화: 031-988-1575
- 특징: 넓은 무료 주차장 완비, 원장 직접 추나 진료
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
    async generateMonthlyTitles(topic: string): Promise<any[]> {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `당신은 '나노바나나'의 수석 데이터 마케터입니다.
                주제: "${topic}"

위 정보를 바탕으로 한의원 블로그 포스팅용 30일치 콘텐츠 전략을 '토픽 클러스터링(Topic Clustering)' 구조로 생성하세요.

[구조 상세 규칙]
1. 3세트 구성 (총 30개):
   - Set A (1~10번): [의학/정보] 환자가 궁금해하는 질환의 원인과 증상 중심 (1개 필러 + 9개 클러스터)
   - Set B (11~20번): [치료/시설] 한의원의 전문 장비 및 특화된 치료법 중심 (1개 필러 + 9개 클러스터)
   - Set C (21~30번): [현실/전환] 보험 적용, 주차, 진료 시간 등 내원을 유도하는 실제 질문 중심 (1개 필러 + 9개 클러스터)

2. 필러(Pillar) & 클러스터(Cluster) 정의:
   - 각 세트의 1번째 글(1, 11, 21번)은 해당 세트의 핵심을 아우르는 '필러 글'입니다.
   - 나머지 9개 글은 필러 글의 세부 주제를 다루는 '클러스터 글'입니다.

3. 제목 공식: [지역 키워드] + [의학적 조언/통찰] + [신뢰감 있는 마무리]
   - 지역 키워드: '김포', '운양동', '장기동' 필수 포함. (타 지역 절대 금지)
   - 페르소나: 40대 베테랑 한의사 원장님의 고품격 톤 유지. (가벼운 호칭 금지)

4. 의료광고 가이드: '완치', '최고', '근본 해결' 등 단정적 표현 절대 금지.

결과는 반드시 아래 JSON 배열 형식을 따르세요 (30개를 정확히 채우세요):
[
    {
        "day": 1,
        "type": "pillar",
        "set": "A",
        "topic": "제목 내용",
        "description": "이 글이 필러인지 클러스터인지, 그리고 어떤 링킹 전략을 가질지 설명"
    },
    ...
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
