import React from 'react';
import { useStepStore } from '../store/useStepStore';
import { Lock } from 'lucide-react';

interface StepGuardProps {
    requiredStep: number;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * STEP 기반 접근 제어 컴포넌트
 * requiredStep 이상일 때만 children을 렌더링합니다.
 */
export const StepGuard: React.FC<StepGuardProps> = ({
    requiredStep,
    children,
    fallback,
}) => {
    const { currentStep } = useStepStore();

    if (currentStep >= requiredStep) {
        return <>{children}</>;
    }

    // 기본 fallback UI
    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 glass-card border-dashed opacity-50">
            <Lock size={32} className="text-gray-600 mb-3" />
            <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">
                STEP {requiredStep} 이상 필요
            </p>
            <p className="text-xs text-gray-700 mt-1">
                현재 STEP: {currentStep}
            </p>
        </div>
    );
};
