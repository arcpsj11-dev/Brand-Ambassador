import React from 'react';
import type { RiskCheckResult } from '../../store/useContentStore';
import { CheckCircle, ShieldCheck, Check } from 'lucide-react';

interface RiskCheckPanelProps {
    result: RiskCheckResult;
    onRecheck?: () => void;
}

/**
 * 리스크 체크 결과를 시각화하는 패널
 */
export const RiskCheckPanel: React.FC<RiskCheckPanelProps> = ({ result }) => {
    if (result.passed) {
        return (
            <div className="glass-card p-4 border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3">
                    <CheckCircle size={24} className="text-green-500" />
                    <div>
                        <h4 className="font-bold text-green-500 uppercase text-xs tracking-widest">Medical Safety Protection Active</h4>
                        <p className="text-[10px] text-gray-500 font-medium">의료법 광고 심의 기준을 준수하며, 검색 노출 안정성이 확보되었습니다.</p>
                    </div>
                </div>
            </div>
        );
    }

    // STEP 1 전용: 상세 정보 숨김 및 요약 중심 표시
    // stepStore.currentStep === 1 이라고 가정 (props로 받거나 store 사용)
    const isStep1 = true; // 현재는 데모를 위해 true로 설정

    if (isStep1) {
        return (
            <div className="glass-card p-5 border-blue-500/20 bg-blue-500/5 space-y-3">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={24} className="text-blue-500" />
                    <div>
                        <h4 className="font-black text-blue-500 uppercase text-xs tracking-widest">
                            Safety Protection Active
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            의료법 보호를 위해 <span className="text-blue-400 font-bold">{result.violations.length}건</span>의 위험 표현을 시스템이 자동으로 교정했습니다.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center gap-2 text-[8px] font-black text-blue-500/60 uppercase tracking-widest bg-blue-500/10 px-2 py-1.5 rounded-lg">
                        <Check size={10} /> 광고 심의 기준 반영
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-black text-blue-500/60 uppercase tracking-widest bg-blue-500/10 px-2 py-1.5 rounded-lg">
                        <Check size={10} /> 검색 노출 안정성 유지
                    </div>
                </div>
            </div>
        );
    }

};
