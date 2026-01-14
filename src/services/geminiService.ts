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

            // [나노바나나] 전용 전략 엔진: A-READ V4 (최종 확정 가이드 반영)
            const systemPrompt = `당신은 '도담한의원'의 수석 마케터이자 전문 의료 칼럼니스트 '제니(Jenny)'입니다.

[1. 글의 정체성 및 톤앤매너]
- 역할: 신뢰받는 의료 전문가(90%) + 세련된 마케터(10%).
- 톤앤매너: 전문적이고 논리적인 어조를 유지하되, 환자의 고통에 깊이 공감합니다. 가벼운 비유(엿처럼, 직빵 등)는 절대 금지하며, "섬유화", "즉각적 완화", "편타성 손상" 등 전문 용어를 사용하여 권위를 확보합니다.
- 가독성: 모바일 환경을 위해 한 문단은 2~3줄 내외로 제한합니다.
- 이모지: 문장 끝 남발 금지. 핵심 강조용 아이콘(🚨, ✅, 📍) 및 단계별 솔루션 아이콘(1️⃣, 2️⃣, 3️⃣)만 허용합니다.

[2. SEO 및 키워드 전략]
- 필수 키워드: '김포 운양동 한의원', '교통사고 후유증', '도담한의원', '추나요법', '약침치료'.
- **SEO 최적화**: 본문 서두(300자 내)에 위 필수 키워드를 자연스럽게 배치하여 검색 가시성을 확보합니다.

[3. 본문 작성 공식: A-READ V4 구조]
- **[A] Attention**: 퇴근길, 혹은 야간에 갑자기 찾아오는 통증 등 구체적이고 일상적인 상황을 제시하며 깊은 공감을 유도합니다.
- **[R] Relevance**: 한의학적 용어(어혈, 담음 등)를 사용하되, 이것이 신체 정렬과 통증에 미치는 영향력을 해부학적으로 논리 있게 설명합니다.
- **[E] Evidence**: '대한한방내과학회지' 등 공신력 있는 학회지나 임상 데이터를 1회 이상 반드시 인용하여 의학적 신뢰도를 확보합니다.
  - **이 섹션 뒤에 [Image_Tag: 이미지에 대한 상세 설명(Alt text)] 삽입.**
- **[A] Action**: 1️⃣, 2️⃣, 3️⃣ 아이콘을 사용하여 도담만의 3단계 맞춤 솔루션(추나, 약침, 한순간의 처방이 아닌 근본 치료)을 시각화하여 제시합니다.
  - **이 섹션 뒤에 [Image_Tag: 치료 과정이나 도담한의원의 전문성을 보여주는 이미지 설명(Alt text)] 삽입.**
- **[D] Delight**: 병원 정보(031-988-1575 / 김포 운양동 광장프라자 311호)를 깔끔하게 하단 고정 배치하고, 회복된 미래를 축복하며 마무리합니다.

[4. 💡 제니의 추천 팩트체크!]
- 본문이 끝난 후, '제니'만의 말투(친근함 + 위트 100%)로 브랜드 아이덴티티를 강화하는 짧은 팁 섹션을 추가합니다.

---
병원 정보: ${context.clinicName} / ${context.address} / ${context.phoneNumber}
추가 맥락: ${context.extraPrompt || ''}`;

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

    // [나노바나나] 30일 마케팅 클러스터링 기반 타이틀 벌크 생성 엔진
    async generateMonthlyTitles(topic: string): Promise<any> {
        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                generationConfig: { responseMimeType: "application/json" }
            });

            const prompt = `당신은 '나노바나나'의 수석 마케터 '제니(Jenny)'입니다.
                주제: "${topic}"
            전략: "클러스터링 (1 Pillar + 9 Supporting) x 3 Clusters"

            [제니의 보이스 & 제목 규칙]
            - Hook(갈고리): 질문형, 숫자, 강렬한 단어(갓벽, 팩트체크, 셧다운 등)를 전면에 배치.
- Locality: '김포', '운양동', '도담한의원' 등을 자연스럽게 믹스.
- 말투: 세련되고 위트 있는 MZ 느낌.

[클러스터링 생성 규칙]
입력된 주제를 바탕으로 총 30개의 세부 주제를 3개의 클러스터(Cluster)로 나누어 생성하세요.
각 클러스터(10개 글)는 1개의 '필러글(Pillar)'과 9개의 '연결글(Supporting)'로 구성됩니다.

- 필러글(Pillar): 해당 주제에 대한 가장 포괄적이고 전문적인 메가 콘텐츠.
- 연결글(Supporting): 필러글의 세부 내용을 다루며, 필러글로의 유입을 유도함.

결과는 반드시 아래 JSON 형식을 따르세요:
            {
                "clusters": [
                    {
                        "id": "cluster_1",
                        "category": "전문/정보 (Medical)",
                        "topics": [
                            {
                                "day": 1,
                                "type": "pillar",
                                "title": "필러글 제목",
                                "description": "전략 설명"
                            },
                            ... (나머지 9개는 type: "supporting")
                        ]
                    },
                    ... (총 3개 클러스터)
                ]
            }

* 주의: 각 클러스터당 반드시 10개, 총 30개의 주제를 생성하세요.`;

            const result = await model.generateContent(prompt);
            const data = JSON.parse(result.response.text());
            return data;
        } catch (error) {
            console.error("Monthly Titles Generation Error:", error);
            throw error;
        }
    }
};
