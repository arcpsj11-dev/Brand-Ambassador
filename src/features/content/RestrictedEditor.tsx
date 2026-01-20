import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Info,
    Pencil,
    Lock,
    X,
    Save,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    Zap
} from 'lucide-react';
import { handleManualCopy, handlePaste } from '../../utils/clipboardUtils';
import { useContentStore, type Content } from '../../store/useContentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useStepStore } from '../../store/useStepStore';
import { RiskFilterEngine } from '../../services/RiskFilterEngine';
import { medicalRuleSet } from '../../services/MedicalRuleSet';

interface RestrictedEditorProps {
    contentId: string;
    onClose: () => void;
}

interface BodySegment {
    id: string;
    text: string;
    isEditable: boolean;
    prevText: string;
}

export const RestrictedEditor: React.FC<RestrictedEditorProps> = ({ contentId, onClose }) => {
    const { getContentById, updateContent, completedCount } = useContentStore();
    const { user } = useAuthStore();
    const { incrementEditSuccess, incrementRiskCorrection, checkAndUpgrade, currentStep, canAccess } = useStepStore();

    const content = getContentById(contentId) as Content;
    const isAdmin = user?.role === 'admin';
    const plan = user?.tier || 'BASIC';
    const filterEngine = useRef(new RiskFilterEngine(medicalRuleSet));

    // 권한 확인
    const titleAuth = canAccess('editTitlePartial', plan);
    const bodyAuth = canAccess('editBodyPartial', plan);

    // State
    // State Initialized directly from content to avoid effect-based setState
    const [title, setTitle] = useState(content?.title || '');
    const [prevTitle, setPrevTitle] = useState(content?.title || '');
    const [segments, setSegments] = useState<BodySegment[]>(() => {
        if (!content) return [];
        const paragraphs = content.body.split('\n\n').filter(p => p.trim() !== '');
        return paragraphs.map((p, i) => ({
            id: `seg-${i}`,
            text: p,
            prevText: p,
            isEditable: isAdmin || (bodyAuth.granted && i >= 2),
        }));
    });

    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);
    const [showHelp, setShowHelp] = useState(false);

    const showToast = (type: 'success' | 'warning' | 'info', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleTitleBlur = () => {
        if (isAdmin) return;
        if (!titleAuth.granted) return;

        const original = content?.title || '';
        const lengthDiff = Math.abs(title.length - original.length);
        const limit = original.length * 0.2;

        if (lengthDiff > limit) {
            setTitle(original);
            showToast('warning', '제목의 핵심 구조 보존을 위해 길이 수정 범위를 초과했습니다.');
            return;
        }

        const originalKeywords = original.split(' ').slice(0, 2).join(' ');
        if (!title.includes(originalKeywords)) {
            setTitle(original);
            showToast('warning', '메인 키워드의 위치나 내용을 보존한 상태에서만 수정 가능합니다.');
            return;
        }

        if (title !== prevTitle) {
            setPrevTitle(title);
        }
    };


    const handleSegmentBlur = (id: string, text: string) => {
        if (isAdmin) return;

        const segment = segments.find(s => s.id === id);
        if (!segment) return;
        if (text === segment.prevText) return;

        const result = filterEngine.current.checkContent(text);
        if (!result.passed) {
            setSegments(prev => prev.map(s => s.id === id ? { ...s, text: s.prevText } : s));
            incrementRiskCorrection();
            showToast('warning', '의료 표현 기준을 벗어난 문장 등이 자동으로 복구되었습니다.');
            return;
        }

        setSegments(prev => prev.map(s => s.id === id ? { ...s, prevText: text, text: text } : s));
    };

    const handleSave = async () => {
        if (!content) return;
        setIsSaving(true);

        const newBody = segments.map(s => s.text).join('\n\n');

        updateContent(contentId, {
            title,
            body: newBody,
            logs: [
                ...(content.logs || []),
                {
                    original: content.body,
                    modified: newBody,
                    autoCorrected: false,
                    timestamp: new Date()
                }
            ]
        });

        incrementEditSuccess();
        checkAndUpgrade({
            completedCount,
            accountStatus: user?.accountStatus || 'NORMAL',
            plan
        });

        showToast('success', '수정 내용이 안전하게 저장되었습니다.');
        setTimeout(() => {
            setIsSaving(false);
            onClose();
        }, 1500);
    };

    if (!content) return null;

    return (
        <div
            onCopy={handleManualCopy}
            className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 text-white no-select"
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                .no-select { user-select: text; -webkit-user-select: text; }
                .editable-paragraph:focus { outline: none; background: rgba(255, 255, 255, 0.05); border-color: rgba(34, 211, 238, 0.3); }
                .fixed-paragraph { cursor: default; }
            `}} />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-5xl h-[95vh] bg-[#0a0a0a] border border-white/5 shadow-2xl rounded-3xl flex flex-col overflow-hidden"
            >
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 flex items-center gap-2 group relative">
                            <Zap size={14} className="text-brand-primary animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary italic">
                                {plan} PLAN · STEP {currentStep}
                            </span>
                        </div>
                        <div className="relative">
                            <button
                                onMouseEnter={() => setShowHelp(true)}
                                onMouseLeave={() => setShowHelp(false)}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
                            >
                                <Info size={18} />
                            </button>
                            <AnimatePresence>
                                {showHelp && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute left-0 top-full mt-2 w-64 p-4 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 text-xs font-medium text-gray-300 leading-relaxed"
                                    >
                                        Protocol v1.0에 의해 요금제와 신뢰도(STEP)의 교집합으로 권한이 결정됩니다.
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-brand-primary/5 px-8 py-3 border-b border-brand-primary/10 flex items-center gap-3">
                    <ShieldCheck size={14} className="text-brand-primary" />
                    <span className="text-[11px] font-bold text-brand-primary uppercase tracking-widest">
                        {titleAuth.granted ? '🔒 부분 수동 조정 모드 활성화됨' : '🔒 BASIC 플랜: 읽기 전용 모드'}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                    <div className="space-y-4">
                        <div className={`flex items-center gap-2 ${titleAuth.granted ? 'text-brand-primary/60' : 'text-gray-600'}`}>
                            {titleAuth.granted ? <Pencil size={14} /> : <Lock size={14} />}
                            <span className="text-[10px] font-black uppercase tracking-widest italic">Title Adjustment</span>
                        </div>
                        <input
                            value={title}
                            readOnly={!titleAuth.granted && !isAdmin}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onPaste={handlePaste}
                            className={`w-full bg-transparent text-4xl font-black focus:outline-none placeholder-white/20 ${titleAuth.granted || isAdmin ? 'text-white' : 'text-white/40 cursor-not-allowed'}`}
                        />
                        <p className="text-[10px] text-gray-600 font-bold">
                            {titleAuth.granted
                                ? '제목의 핵심 구조는 유지됩니다. 표현만 다듬어 주세요. (±20% 이내 수정 가능)'
                                : '제목을 수정하려면 PRO 플랜 이상이 필요합니다.'}
                        </p>
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="space-y-6">
                        {segments.map((seg) => (
                            <div key={seg.id} className="relative group">
                                {!seg.isEditable ? (
                                    <div
                                        onClick={() => showToast('info', !bodyAuth.granted ? '본문을 수정하려면 PRO 플랜 이상이 필요합니다.' : '이 문단은 블로그 구조 안정화를 위해 수정할 수 없습니다.')}
                                        className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 opacity-40 fixed-paragraph transition-opacity hover:opacity-100"
                                    >
                                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                                            <Lock size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest italic tracking-tighter">System Protected Structure</span>
                                        </div>
                                        <p className="text-base text-white/50 leading-relaxed font-medium">{seg.text}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-brand-primary">
                                            <Pencil size={12} />
                                            <span className="text-[9px] font-black uppercase tracking-widest italic tracking-tighter">Creative Expansion Zone</span>
                                        </div>
                                        <textarea
                                            value={seg.text}
                                            onChange={(e) => {
                                                const newText = e.target.value;
                                                setSegments(prev => prev.map(s => s.id === seg.id ? { ...s, text: newText } : s));
                                            }}
                                            onBlur={(e) => handleSegmentBlur(seg.id, e.target.value)}
                                            onPaste={handlePaste}
                                            rows={4}
                                            className="w-full p-6 bg-transparent border border-white/10 rounded-2xl text-base text-white leading-relaxed font-medium editable-paragraph transition-all resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 p-8 rounded-3xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col items-center gap-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                            <Lock size={20} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black uppercase tracking-widest text-gray-500">Next Stage: STEP 3 (Operator Mode)</h4>
                            <p className="text-xs text-gray-600 leading-relaxed max-w-sm">
                                전체 구조 변경, CTA 삽입, 키워드 전략 수정 권한은<br />
                                <span className="text-brand-primary font-black">ULTRA 플랜</span> + <span className="text-brand-primary font-black">STEP 3</span> 달성 시 해금됩니다.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-medium">
                        <MessageSquare size={14} className="text-brand-primary" />
                        <span>수정된 내용은 실시간으로 보존되며, 저장 시 아카이브에 반영됩니다.</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-6 py-3 rounded-xl hover:bg-white/5 text-gray-400 font-bold text-sm">닫기</button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || (title === prevTitle && segments.every(s => s.text === s.prevText))}
                            className="px-10 py-3 rounded-xl bg-brand-primary text-black font-black uppercase text-sm tracking-widest hover:shadow-neon transition-all flex items-center gap-2 disabled:opacity-30"
                        >
                            {isSaving ? '저장 중...' : '변경 사항 저장'}
                            <Save size={18} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: 50, x: '-50%' }}
                            className={`fixed bottom-10 left-1/2 px-6 py-4 rounded-2xl border shadow-2xl z-[200] flex items-center gap-3 ${toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
                                }`}
                        >
                            {toast.type === 'warning' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                            <span className="text-sm font-bold">{toast.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
