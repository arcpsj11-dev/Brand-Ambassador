import React, { useState } from 'react';
import { useProfileStore, type ContentTone } from '../../store/useProfileStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Building2, User, MessageSquare, Plus, X, Image as ImageIcon } from 'lucide-react';
import { handleManualCopy, handlePaste } from '../../utils/clipboardUtils';

type SetupStep = 1 | 2 | 3 | 4;

// --- Sub-components moved outside to fix the "focus loss" bug ---

interface StepProps {
    localData: any;
    setLocalData: (data: any) => void;
}

// STEP 1: 병원 기본 정보
const Step1: React.FC<StepProps> = ({ localData, setLocalData }) => {
    const [customSubject, setCustomSubject] = useState('');

    const addCustomSubject = () => {
        if (customSubject.trim() && !localData.subjects.includes(customSubject.trim())) {
            setLocalData({
                ...localData,
                subjects: [...localData.subjects, customSubject.trim()],
            });
            setCustomSubject('');
        }
    };

    const removeSubject = (subjectToRemove: string) => {
        setLocalData({
            ...localData,
            subjects: localData.subjects.filter((s: string) => s !== subjectToRemove),
        });
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
                    onPaste={handlePaste}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary transition-all outline-none"
                />
            </div>

            <div className="space-y-4">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    진료과목 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCustomSubject()}
                        placeholder="진료 과목을 입력하고 Enter를 누르세요 (예: 교통사고, 다이어트)"
                        onPaste={handlePaste}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary transition-all outline-none"
                    />
                    <button
                        onClick={addCustomSubject}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                        <Plus size={14} /> 추가
                    </button>
                </div>

                {/* 선택된 과목들 표시 */}
                <div className="flex flex-wrap gap-2">
                    {localData.subjects.map((subject: string) => (
                        <span key={subject} className="px-3 py-1.5 bg-brand-primary/20 text-brand-primary rounded-lg text-xs font-bold flex items-center gap-2 border border-brand-primary/20">
                            {subject}
                            <X size={14} className="cursor-pointer hover:text-white" onClick={() => removeSubject(subject)} />
                        </span>
                    ))}
                    {localData.subjects.length === 0 && (
                        <span className="text-xs text-gray-600 px-2 py-1">등록된 진료과목이 없습니다.</span>
                    )}
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
                    onPaste={handlePaste}
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
                    onPaste={handlePaste}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-brand-primary transition-all outline-none"
                />
            </div>
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
                    onPaste={handlePaste}
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
                onPaste={handlePaste}
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
                onPaste={handlePaste}
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

            <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-gray-500 text-xs leading-relaxed">
                * 콘텐츠 톤은 글의 전반적인 분위기를 결정합니다. <br />
                * 공격적 표현 및 후기 언급 옵션은 보다 자연스러운 글 생성을 위해 자동으로 최적화됩니다.
            </div>
        </motion.div>
    );
};

// STEP 4: 병원 원내 사진
import { storageService } from '../../services/storageService'; // [NEW]
import { useAuthStore } from '../../store/useAuthStore'; // [NEW]

const Step4: React.FC<StepProps> = ({ localData, setLocalData }) => {
    const { user } = useAuthStore();
    const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({}); // [NEW] Track upload status per category

    const photoCategories = [
        { id: 'entrance', label: '현관 (입구)' },
        { id: 'desk', label: '데스크' },
        { id: 'director_room', label: '원장실' },
        { id: 'treatment_room', label: '치료실' },
        { id: 'consultation', label: '상담하는 모습' },
        { id: 'treatment_scene', label: '진료하는 모습' },
        { id: 'acupuncture', label: '침치료하는 모습' },
        { id: 'chuna', label: '추나하는 모습' },
    ];

    const handleFileChange = async (id: string, file: File | null) => {
        if (!file) return;
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }

        // Set uploading state for this category
        setUploadingState(prev => ({ ...prev, [id]: true }));

        try {
            // [NEW] Use storageService to convert & upload
            const publicUrl = await storageService.uploadImage(file, user.id, id);

            setLocalData({
                ...localData,
                clinicPhotos: {
                    ...localData.clinicPhotos,
                    [id]: publicUrl
                }
            });
        } catch (error) {
            console.error("Upload failed:", error);
            alert("이미지 업로드에 실패했습니다. (용량 제한 없음)");
        } finally {
            setUploadingState(prev => ({ ...prev, [id]: false }));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {photoCategories.map((cat) => {
                    const isUploading = uploadingState[cat.id];
                    const hasImage = !!localData.clinicPhotos?.[cat.id];

                    return (
                        <div key={cat.id} className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                {cat.label}
                                {hasImage && !isUploading && <span className="text-brand-primary text-[10px] flex items-center gap-1"><Check size={10} /> Saved</span>}
                            </label>
                            <div className={`relative group transition-all rounded-xl border ${hasImage ? 'border-brand-primary/50 bg-brand-primary/5' : 'border-white/10 bg-white/5'}`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(cat.id, e.target.files?.[0] || null)}
                                    disabled={isUploading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                                />
                                <div className="p-4 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${hasImage ? 'bg-brand-primary text-black' : 'bg-white/10 text-gray-500'}`}>
                                        {isUploading ? (
                                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <ImageIcon size={20} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-bold truncate ${hasImage ? 'text-white' : 'text-gray-500'}`}>
                                            {isUploading ? '업로드 중 (WebP 변환)...' : (localData.clinicPhotos?.[cat.id] ? '사진 등록됨' : '사진 업로드...')}
                                        </div>
                                        <div className="text-[10px] text-gray-600">
                                            {isUploading ? '잠시만 기다려주세요' : '클릭하여 파일 선택 (자동 최적화)'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-center text-balance">
                * 업로드된 사진은 <strong>자동으로 WebP 포맷으로 최적화</strong>되어 클라우드에 영구 저장됩니다.<br />
                * 콘텐츠 생성 시 해당 주제('병원 내부', '치료 과정' 등)가 나올 때 자동으로 삽입됩니다.
            </p>
        </motion.div>
    );
}

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
        // Removed deprecated fields from local usage but kept in store just in case
        clinicPhotos: profile.clinicPhotos || {},
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
        if (currentSetupStep === 4) {
            return true; // Optional step
        }
        return false;
    };

    // 다음 단계
    const handleNext = () => {
        if (currentSetupStep < 4) {
            setCurrentSetupStep((prev) => (prev + 1) as SetupStep);
        }
    };

    // 이전 단계
    const handlePrev = () => {
        if (currentSetupStep > 1) {
            setCurrentSetupStep((prev) => (prev - 1) as SetupStep);
        }
    };

    // 완료
    const handleComplete = () => {
        if (!isStepValid()) return;

        profile.setProfile(localData);
        profile.setProfileComplete(true);
        setIsSaved(true);

        // 2초 후 성공 메시지 숨김
        setTimeout(() => setIsSaved(false), 2000);
    };

    const steps = [
        { num: 1, label: '병원 정보', icon: Building2 },
        { num: 2, label: '원장 포지션', icon: User },
        { num: 3, label: '콘텐츠 방향', icon: MessageSquare },
        { num: 4, label: '원내 사진', icon: ImageIcon },
    ];

    return (
        <div
            onCopy={handleManualCopy}
            className="min-h-[80vh] flex items-center justify-center p-6"
        >
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
                            {currentSetupStep === 4 && (
                                <Step4 key="step4" localData={localData} setLocalData={setLocalData} />
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
                        {currentSetupStep < 4 ? (
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

