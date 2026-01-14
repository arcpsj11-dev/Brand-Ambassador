import type { RiskCheckResult } from '../store/useContentStore';
import type { RuleSet } from './RiskFilterEngine';

// 의료법 위반 금지 문구
const PROHIBITED_PHRASES = [
    '100% 완치',
    '100% 치료',
    '완치 보장',
    '부작용 없음',
    '부작용 전혀 없음',
    '효과 보장',
    '반드시 효과',
    '무조건 좋아',
    '최고의 치료',
    '유일한 치료',
    '기적의 치료',
    '절대 안전',
    '완벽한 치료',
    '즉시 완치',
    '당일 완치',
    '확실한 효과',
    '100% 효과',
];

// 위험 표현 패턴 (정규식)
const RISK_PATTERNS = [
    {
        pattern: /\d+%\s*(완치|치료|효과|개선)/g,
        reason: '치료 효과를 수치로 보장하는 표현은 의료법 위반입니다.',
        severity: 'HIGH' as const,
    },
    {
        pattern: /(절대|반드시|무조건|확실히|100%)\s*(낫|치료|완치|효과)/g,
        reason: '절대적 표현을 사용한 치료 효과 보장은 금지됩니다.',
        severity: 'HIGH' as const,
    },
    {
        pattern: /(부작용|副作用)\s*(없|zero|제로|전혀)/gi,
        reason: '부작용이 없다는 단정적 표현은 사용할 수 없습니다.',
        severity: 'HIGH' as const,
    },
    {
        pattern: /(최고|최상|최고급|넘버원|1등|1위)\s*(병원|한의원|의원|클리닉|치료)/gi,
        reason: '비교 우위를 나타내는 최상급 표현은 제한됩니다.',
        severity: 'MEDIUM' as const,
    },
    {
        pattern: /(유일|독점|오직|only)\s*(치료|기술|방법)/gi,
        reason: '유일성을 주장하는 표현은 주의가 필요합니다.',
        severity: 'MEDIUM' as const,
    },
    {
        pattern: /(\d+일|당일|즉시|바로)\s*(완치|치료)/g,
        reason: '치료 기간을 단정적으로 명시하는 표현은 위험합니다.',
        severity: 'HIGH' as const,
    },
    {
        pattern: /(기적|신비|놀라운|획기적)\s*(효과|치료|결과)/gi,
        reason: '과장된 효과 표현은 자제해야 합니다.',
        severity: 'MEDIUM' as const,
    },
];

// 제안 메시지
const SUGGESTIONS = [
    '치료 효과 대신 "증상 개선에 도움을 드립니다" 등의 표현을 사용하세요.',
    '절대적 표현 대신 "대부분의 경우", "일반적으로" 등의 완화된 표현을 사용하세요.',
    '개인별 치료 효과가 다를 수 있음을 명시하세요.',
    '의학적 근거나 연구 결과를 인용할 때는 출처를 명확히 하세요.',
];

/**
 * 의료 업종 전용 규칙 세트
 */
export class MedicalRuleSet implements RuleSet {
    getName(): string {
        return 'MedicalRuleSet';
    }

    check(content: string): RiskCheckResult {
        const violations: Array<{
            text: string;
            reason: string;
            severity: 'HIGH' | 'MEDIUM' | 'LOW';
        }> = [];

        // 1. 금지 문구 체크
        PROHIBITED_PHRASES.forEach((phrase) => {
            if (content.includes(phrase)) {
                violations.push({
                    text: phrase,
                    reason: `"${phrase}"는 의료법에서 금지하는 표현입니다.`,
                    severity: 'HIGH',
                });
            }
        });

        // 2. 위험 패턴 체크
        RISK_PATTERNS.forEach(({ pattern, reason, severity }) => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach((match) => {
                    violations.push({
                        text: match,
                        reason,
                        severity,
                    });
                });
            }
        });

        // 3. 결과 반환
        const passed = violations.length === 0;
        const suggestions = passed ? [] : SUGGESTIONS;

        return {
            passed,
            violations,
            suggestions,
        };
    }
}

// 싱글톤 인스턴스 export
export const medicalRuleSet = new MedicalRuleSet();
