import type { RiskCheckResult } from '../store/useContentStore';

// 규칙 세트 인터페이스
export interface RuleSet {
    check(content: string): RiskCheckResult;
    getName(): string;
}

// 리스크 필터 엔진
export class RiskFilterEngine {
    private ruleSet: RuleSet;

    constructor(ruleSet: RuleSet) {
        this.ruleSet = ruleSet;
    }

    /**
     * 콘텐츠 리스크 체크
     */
    checkContent(text: string): RiskCheckResult {
        return this.ruleSet.check(text);
    }

    /**
     * 규칙 세트 변경 (업종 전환 시)
     */
    setRuleSet(ruleSet: RuleSet): void {
        this.ruleSet = ruleSet;
    }

    /**
     * 현재 규칙 세트 이름 반환
     */
    getRuleSetName(): string {
        return this.ruleSet.getName();
    }
}
