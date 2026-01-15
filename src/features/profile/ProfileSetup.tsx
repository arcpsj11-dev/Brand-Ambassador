import React, { useState } from 'react';
import { useProfileStore, type ContentTone } from '../../store/useProfileStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Building2, User, MessageSquare, Plus, X } from 'lucide-react';

type SetupStep = 1 | 2 | 3;

// --- Sub-components moved outside to fix the "focus loss" bug ---

interface StepProps {
    localData: any;
    setLocalData: (data: any) => void;
}

// STEP 1: 병원 기본 정보
const Step1: React.FC<StepProps> = ({ localData, setLocalData }) => {
    const [customSubject, setCustomSubject] = useState('');

    const subjectOptions = [
        '내과', '침구과', '한방부인과', '한방소아과', '한방재활의학과',
        '사상체질과', '한방신경정신과', '한방안이비인후피부과'
    ];

    const toggleSubject = (subject: string) => {
        const isSelected = localData.subjects.includes(subject);
        if (isSelected) {
            setLocalData({
                ...localData,
                subjects: localData.subjects.filter((s: string) => s !== subject),
            });
        } else {
            setLocalData({
                ...localData,
                subjects: [...localData.subjects, subject],
            });
        }
    };

    const addCustomSubject = () => {
        if (customSubject.trim() && !localData.subjects.includes(customSubject.trim())) {
            setLocalData({
                ...localData,
                subjects: [...localData.subjects, customSubject.trim()],
            });
            setCustomSubject('');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    병원명 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={localData.clinicName}
                    onChange={(e) => setLocalData({ ...localData, clinicName: e.target.value })}
                    placeholder="예: 도담한의원"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary transition-all outline-none"
                />
            </div>

            <div className="space-y-4">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    진료과목 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {subjectOptions.map((subject) => {
                        const isSelected = localData.subjects.includes(subject);
                        return (
                            <button
                                key={subject}
                                onClick={() => toggleSubject(subject)}
                                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${isSelected
                                    ? 'bg-brand-primary text-black'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {subject}
                            </button>
                        );
                    })}
                </div>

                {/* 커스텀 과목 입력 */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomSubject()}
                        placeholder="직접 입력 (예: 성장클리닉)"
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-brand-primary transition-all outline-none"
                    />
                    <button
                        onClick={addCustomSubject}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                        <Plus size={14} /> 추가
                    </button>
                </div>

                {/* 선택된 커스텀 과목들 표시 (목록에 없는 것들) */}
                <div className="flex flex-wrap gap-2">
                    {localData.subjects.filter((s: string) => !subjectOptions.includes(s)).map((subject: string) => (
                        <span key={subject} className="px-3 py-1 bg-brand-primary/20 text-brand-primary rounded-full text-[10px] font-bold flex items-center gap-1">
                            {subject}
                            <X size={12} className="cursor-pointer hover:text-white" onClick={() => toggleSubject(subject)} />
                        </span>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    주요 타깃 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={localData.targetDemographic}
                    onChange={(e) => setLocalData({ ...localData, targetDemographic: e.target.value })}
                    placeholder="예: 30-50대 여성, 교통사고 환자"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary transition-all outline-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    진료 지역 <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={localData.region}
                    onChange={(e) => setLocalData({ ...localData, region: e.target.value })}
                    placeholder="예: 김포 운양동"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary transition-all outline-none"
                />
            </div>

            {/* 네이버 블로그 ID 등록 (제거됨 - 슬롯에서 관리) */}
            {/* <div className="space-y-2 opacity-50 pointer-events-none hidden">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    네이버 블로그 ID (Slot에서 관리됨)
                </label>
            </div> */}
            <p className="text-[10px] text-gray-500 mt-1">
                * 등록된 아이디는 대시보드에서 지수/성과 분석에 활용됩니다.
            </p>
        </motion.div>
    );
};

// STEP 2: 원장 전문 포지션
const Step2: React.FC<StepProps> = ({ localData, setLocalData }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
    >
        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                주력 진료 키워드 (최대 3개) <span className="text-red-500">*</span>
            </label>
            {[0, 1, 2].map((index) => (
                <input
                    key={index}
                    type="text"
                    value={localData.keyKeywords[index] || ''}
                    onChange={(e) => {
                        const newKeywords = [...localData.keyKeywords];
                        newKeywords[index] = e.target.value;
                        setLocalData({ ...localData, keyKeywords: newKeywords.filter(k => k) });
                    }}
                    placeholder={`키워드 ${index + 1}: 예) 교통사고 추나치료`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary transition-all outline-none"
                />
            ))}
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                핵심 주제 <span className="text-red-500">*</span>
            </label>
            <textarea
                value={localData.mainTopic}
                onChange={(e) => setLocalData({ ...localData, mainTopic: e.target.value })}
                placeholder="예: 교통사고 후유증 치료, 추나요법 전문"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary transition-all outline-none h-24 resize-none"
            />
        </div>

        <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                피하고 싶은 주제 (선택)
            </label>
            <textarea
                value={localData.avoidTopics.join(', ')}
                onChange={(e) => setLocalData({
                    ...localData,
                    avoidTopics: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                })}
                placeholder="예: 다이어트, 미용 시술 (쉼표로 구분)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary transition-all outline-none h-20 resize-none"
            />
        </div>
    </motion.div>
);

// STEP 3: 콘텐츠 톤 & 방향
const Step3: React.FC<StepProps> = ({ localData, setLocalData }) => {
    const toneOptions: { value: ContentTone; label: string; desc: string }[] = [
        { value: 'informative', label: '정보형', desc: '신뢰할 수 있는 정보 제공 중심' },
        { value: 'authoritative', label: '권위형', desc: '전문가로서의 권위 강조' },
        { value: 'consultative', label: '상담형', desc: '친근하고 공감하는 톤' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-3">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    콘텐츠 톤 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                    {toneOptions.map((option) => {
                        const isSelected = localData.contentTone === option.value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => setLocalData({ ...localData, contentTone: option.value })}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${isSelected
                                    ? 'bg-brand-primary/10 border-brand-primary text-brand-primary border'
                                    : 'bg-white/5 border-white/10 text-gray-400 border hover:bg-white/10'
                                    }`}
                            >
                                <div className="font-bold">{option.label}</div>
                                <div className="text-xs opacity-70">{option.desc}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={localData.allowAggressiveExpression}
                        onChange={(e) => setLocalData({ ...localData, allowAggressiveExpression: e.target.checked })}
                        className="w-5 h-5 accent-brand-primary"
                    />
                    <span className="text-sm">공격적 표현 허용 (의료법 한계 내)</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={localData.allowReviewMention}
                        onChange={(e) => setLocalData({ ...localData, allowReviewMention: e.target.checked })}
                        className="w-5 h-5 accent-brand-primary"
                    />
                    <span className="text-sm">후기·사례 언급 허용</span>
                </label>
            </div>
        </motion.div>
    );
};

export const ProfileSetup: React.FC = () => {
    const [currentSetupStep, setCurrentSetupStep] = useState<SetupStep>(1);
    const profile = useProfileStore();

    // 로컬 상태 (임시 저장용)
    const [localData, setLocalData] = useState({
        clinicName: profile.clinicName,
        subjects: profile.subjects,
        targetDemographic: profile.targetDemographic,
        region: profile.region,
        keyKeywords: profile.keyKeywords,
        mainTopic: profile.mainTopic,
        avoidTopics: profile.avoidTopics,
        contentTone: profile.contentTone,
        allowAggressiveExpression: profile.allowAggressiveExpression,
        allowReviewMention: profile.allowReviewMention,
        blogAccounts: profile.blogAccounts || [], // Initialize with profile or empty array
    });

    const [isSaved, setIsSaved] = useState(false);

    // 현재 스텝 유효성 검사
    const isStepValid = () => {
        if (currentSetupStep === 1) {
            return !!(localData.clinicName && localData.subjects.length > 0 && localData.targetDemographic && localData.region);
        }
        if (currentSetupStep === 2) {
            return !!(localData.keyKeywords.length > 0 && localData.mainTopic);
        }
        if (currentSetupStep === 3) {
            return !!localData.contentTone;
        }
        return false;
    };

    // 다음 단계
    const handleNext = () => {
        if (currentSetupStep < 3) {
            setCurrentSetupStep((currentSetupStep + 1) as SetupStep);
        }
    };

    // 이전 단계
    const handlePrev = () => {
        if (currentSetupStep > 1) {
            setCurrentSetupStep((currentSetupStep - 1) as SetupStep);
        }
    };

    // 완료
    const handleComplete = () => {
        if (!isStepValid()) return;

        profile.setProfile(localData);
        if (localData.blogAccounts?.length > 0) {
            // 사이드 이펙트로 첫 번째 계정 자동 선택
            profile.selectBlogAccount(localData.blogAccounts[0]);
        }
        profile.setProfileComplete(true);
        setIsSaved(true);

        // 2초 후 성공 메시지 숨김
        setTimeout(() => setIsSaved(false), 2000);
    };

    const steps = [
        { num: 1, label: '병원 정보', icon: Building2 },
        { num: 2, label: '원장 포지션', icon: User },
        { num: 3, label: '콘텐츠 방향', icon: MessageSquare },
    ];

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl"
            >
                <div className="glass-card p-8 space-y-8 relative overflow-hidden">
                    {/* 성공 오버레이 */}
                    <AnimatePresence>
                        {isSaved && (
                            <motion.div
                                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
                                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-primary/10"
                            >
                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-20 h-20 bg-brand-primary text-black rounded-full flex items-center justify-center shadow-neon mb-4"
                                >
                                    <Check size={40} strokeWidth={4} />
                                </motion.div>
                                <h2 className="text-2xl font-black neon-text uppercase italic">Settings Saved!</h2>
                                <p className="text-sm font-bold text-gray-400 mt-2">프로파일 정보가 성공적으로 반영되었습니다.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 헤더 */}
                    <div className="text-center space-y-3">
                        <h1 className="text-3xl font-black neon-text uppercase italic tracking-tighter">
                            프로파일 설정
                        </h1>
                        <p className="text-gray-500 text-sm font-medium">
                            {profile.isProfileComplete ? '정보를 언제든지 수정하실 수 있습니다' : '안티그래비티가 최적의 콘텐츠를 생성하기 위한 정보를 입력해주세요'}
                        </p>
                    </div>

                    {/* 스텝 인디케이터 */}
                    <div className="flex justify-between items-center">
                        {steps.map((step, index) => {
                            const isActive = currentSetupStep === step.num;
                            const isCompleted = currentSetupStep > step.num;
                            const Icon = step.icon;

                            return (
                                <React.Fragment key={step.num}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                ? 'bg-brand-primary text-black'
                                                : isActive
                                                    ? 'bg-brand-primary/20 text-brand-primary border-2 border-brand-primary'
                                                    : 'bg-white/5 text-gray-600'
                                                }`}
                                        >
                                            {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-brand-primary' : 'text-gray-600'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-1 mx-2 rounded-full ${isCompleted ? 'bg-brand-primary' : 'bg-white/5'}`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* 폼 콘텐츠 */}
                    <div className="min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {currentSetupStep === 1 && (
                                <Step1 key="step1" localData={localData} setLocalData={setLocalData} />
                            )}
                            {currentSetupStep === 2 && (
                                <Step2 key="step2" localData={localData} setLocalData={setLocalData} />
                            )}
                            {currentSetupStep === 3 && (
                                <Step3 key="step3" localData={localData} setLocalData={setLocalData} />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 하단 유효성 메시지 */}
                    {!isStepValid() && (
                        <p className="text-center text-[10px] font-black text-red-500/60 uppercase tracking-widest">
                            * 모든 필수 항목(*)을 입력해야 다음으로 진행할 수 있습니다
                        </p>
                    )}

                    {/* 버튼 */}
                    <div className="flex gap-4">
                        {currentSetupStep > 1 && (
                            <button
                                onClick={handlePrev}
                                className="flex-1 px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 font-black uppercase text-xs tracking-widest transition-all border border-white/5"
                            >
                                이전
                            </button>
                        )}
                        {currentSetupStep < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={!isStepValid()}
                                className="flex-1 px-6 py-4 rounded-xl bg-brand-primary text-black font-black uppercase text-xs tracking-widest hover:shadow-neon transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                다음 단계
                                <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                disabled={!isStepValid()}
                                className="flex-1 px-6 py-4 rounded-xl bg-brand-primary text-black font-black uppercase text-xs tracking-widest hover:shadow-neon transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Check size={18} />
                                설정 완료
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

