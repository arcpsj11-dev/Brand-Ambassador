import type { ContentClusterRow } from './topicClusterService';

export interface PromptContext {
    currentTopic: ContentClusterRow;
    nextTopic: ContentClusterRow | null;
    pillarTitle?: string;
    clinicInfo: {
        name: string;
        address: string;
        phone: string;
    };
}

/**
 * Build dynamic prompt with current topic + next topic preview
 * Handles special cases for cluster boundaries (days 10, 20, 30)
 */
export function buildContentPrompt(context: PromptContext): string {
    const { currentTopic, nextTopic, pillarTitle, clinicInfo } = context;

    // Determine next topic title for preview
    let nextTopicTitle: string;
    const isClusterEnd = currentTopic.day_number % 10 === 0;

    if (currentTopic.day_number === 30) {
        // Last topic - series conclusion
        nextTopicTitle = "이번 시리즈를 마무리하며, 앞으로도 건강한 일상을 위한 정보를 계속 전해드리겠습니다";
    } else if (isClusterEnd && pillarTitle) {
        // End of cluster (day 10 or 20) - reference to pillar
        nextTopicTitle = `${pillarTitle} 종합 가이드`;
    } else if (nextTopic) {
        // Normal case - use next topic title
        nextTopicTitle = nextTopic.title;
    } else {
        // Fallback
        nextTopicTitle = "다음 주제";
    }

    // Build the instruction prompt
    const promptTemplate = `
## [현재 작성 주제]
${currentTopic.title}

## [다음 화 예고 대상]
${nextTopicTitle}

## [필수 작성 규칙]

### 1. 글 구조
- 서론: 독자의 공감을 이끄는 문제 제시
- 본론: 전문적이면서도 이해하기 쉬운 설명 (3-4개 섹션)
- 결론: 실천 가능한 조언과 다음 화 예고

### 2. 병원 정보 삽입
글 하단에 자연스럽게 병원 정보를 포함하세요:

---
**${clinicInfo.name}**
📍 ${clinicInfo.address}
📞 ${clinicInfo.phone}
---

### 3. 다음 연재 예고 (필수)
글의 마지막 문단은 반드시 "다음 연재 예고" 섹션으로 구성하세요.
- **반드시 "${nextTopicTitle}"를 명시적으로 언급**하세요.
- 독자가 다음 글을 궁금해하도록 유도하는 브릿지 문장을 작성하세요.
- 자연스럽고 흥미로운 톤으로 작성하세요.

예시:
"다음 편에서는 **'${nextTopicTitle}'**에 대해 자세히 알아보겠습니다. 일상에서 자주 마주하지만 놓치기 쉬운 중요한 내용이니, 놓치지 말고 확인해 주세요!"

### 4. 내부 링크 (선택)
${pillarTitle ? `현재 주제는 "${pillarTitle}" 시리즈의 일부입니다. 본문 중간에 자연스럽게 "${pillarTitle}"를 언급하며 연결성을 강화하세요.` : ''}

### 5. 톤 & 스타일
- 전문적이면서도 친근한 톤
- 의료 전문 용어 사용 시 쉬운 설명 병행
- 환자의 공감을 이끄는 스토리텔링
- 과장 금지, 근거 기반의 정확한 정보 제공

### 6. 금지 사항
- 의료법 위반 표현 (치료 효과 과장, 치료 전후 비교 등)
- "최고", "가장", "1등" 등 비교 우위 표현
- 근거 없는 단정적 표현
- 다른 병원 비방

이제 위 규칙을 엄격히 준수하여 "${currentTopic.title}"에 대한 블로그 포스팅을 작성해주세요.
`.trim();

    return promptTemplate;
}

/**
 * Build a simpler prompt for preview/testing
 */
export function buildSimplePrompt(currentTitle: string, nextTitle?: string): string {
    return `
주제: ${currentTitle}

${nextTitle ? `다음 주제 예고: ${nextTitle}` : ''}

위 주제에 대해 전문적이면서도 이해하기 쉬운 블로그 포스팅을 작성해주세요.
마지막에는 다음 주제(${nextTitle || '다음 편'})에 대한 예고 문구를 포함하세요.
`.trim();
}
