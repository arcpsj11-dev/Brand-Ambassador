import type { Keyword, KeywordGrade } from '../store/useKeywordStore';

export const calculateGrade = (ratio: number): KeywordGrade => {
    if (ratio >= 1.0) return '다이아';
    if (ratio >= 0.5) return '골드';
    if (ratio >= 0.1) return '실버';
    return '브론즈';
};

export const generateMockKeywords = (): Keyword[] => {
    const terms = ['김포 한의원', '구래동 교통사고', '다이어트 한약', '추나 치료', '한의원 추천', '야간진료 한의원'];
    return terms.map((term) => {
        const searchVolume = Math.floor(Math.random() * 5000) + 500;
        const documentCount = Math.floor(Math.random() * 3000) + 100;
        const ratio = parseFloat((searchVolume / documentCount).toFixed(2));
        return {
            id: Math.random().toString(36).substr(2, 9),
            term,
            searchVolume,
            documentCount,
            ratio,
            grade: calculateGrade(ratio),
            isDeleted: false,
        };
    });
};
