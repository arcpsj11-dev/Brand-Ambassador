import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    Pencil,
    X,
    AlertCircle,
    CheckCircle2,
    MessageSquare,
    Zap,
    Link,
    Clock,
    Send,
    ChevronDown,
    Layout,
    Lock
} from 'lucide-react';
import { useContentStore, type Content } from '../../store/useContentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useStepStore } from '../../store/useStepStore';
import { RiskFilterEngine } from '../../services/RiskFilterEngine';
import { medicalRuleSet } from '../../services/MedicalRuleSet';

interface FullEditorProps {
    contentId: string;
    onClose: () => void;
}

const CTA_TEMPLATES = [
    { id: 'consult', label: '상담 문의형', text: '더 궁금하신 점이 있다면 언제든 편하게 상담 신청해 주세요. 정성을 다해 도와드리겠습니다.' },
    { id: 'info', label: '정보 더보기형', text: '관련된 더 자세한 정보는 아래 링크에서 확인하실 수 있습니다.' },
    { id: 'intro', label: '병원 소개형', text: '저희 병원은 언제나 환자분의 건강을 최우선으로 생각합니다. 지금 방문해 보세요.' },
    { id: 'next', label: '다음 글 유도형', text: '이 글이 도움이 되셨나요? 다음 글에서 더 유용한 건강 정보를 확인해 보세요.' }
];

export const FullEditor: React.FC<FullEditorProps> = ({ contentId, onClose }) => {
    const { getContentById, updateContent } = useContentStore();
    const { user } = useAuthStore();
    const { incrementRiskCorrection, canAccess } = useStepStore();

    const content = getContentById(contentId) as Content;
    const plan = user?.tier || 'START';
    const filterEngine = useRef(new RiskFilterEngine(medicalRuleSet));

    // 권한 확인 (SCALE 전용 기능들)
    const titleAuth = canAccess('editTitleFull', plan);
    const bodyAuth = canAccess('editBodyFull', plan);
    const slugAuth = canAccess('editSlug', plan);
    const ctaAuth = canAccess('insertCTA', plan);
    const scheduleAuth = canAccess('manualSchedule', plan);

    // State
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [slug, setSlug] = useState('');
    const [selectedCta, setSelectedCta] = useState(CTA_TEMPLATES[0]);
    const [ctaText, setCtaText] = useState(CTA_TEMPLATES[0].text);
    const [toast, setToast] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);

    // Initial Load
    useEffect(() => {
        if (content) {
            setTitle(content.title);
            setBody(content.body);
            setSlug(content.id.replace('content-', 'post-'));
        }
    }, [content]);

    const showToast = (type: 'success' | 'warning' | 'info', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleBodyBlur = (text: string) => {
        if (!bodyAuth.granted) return;

        const result = filterEngine.current.checkContent(text);
        if (!result.passed) {
            let corrected = text;
            result.violations.forEach(v => {
                corrected = corrected.replace(v.text, '*** (보호된 표현) ***');
            });
            setBody(corrected);
            incrementRiskCorrection();
            showToast('info', '의료 기준을 벗어난 표현이 안전하게 수정되었습니다.');
        }
    };

    const handleSave = async (isPublishing = false) => {
        if (!content) return;

        const finalBody = `${body}\n\n---\n\n${ctaText}`;

        updateContent(contentId, {
            title,
            body: finalBody,
            status: isPublishing ? 'PUBLISHED' : content.status,
            logs: [
                ...(content.logs || []),
                {
                    original: content.body,
                    modified: finalBody,
                    autoCorrected: true,
                    timestamp: new Date()
                }
            ]
        });

        showToast('success', isPublishing ? '콘텐츠가 발행되었습니다.' : '변경 사항이 안전하게 저장되었습니다.');
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    if (!content) return null;

    return (
        <div className="fixed inset-0 z-[160] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 text-white no-select">
            <style dangerouslySetInnerHTML={{
                __html: `
                .full-textarea:focus { outline: none; border-color: rgba(34, 211, 238, 0.4); background: rgba(255, 255, 255, 0.02); }
            `}} />

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-6xl h-[95vh] bg-[#050505] border border-white/5 shadow-2x-neon rounded-[40px] flex flex-col overflow-hidden"
            >
                <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-brand-primary/5 to-transparent">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-primary italic">{plan} PLAN · OPERATOR MODE</span>
                            </div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                                <Layout className="text-brand-primary" size={24} />
                                STEP 3 · FULL INTERVENTION
                            </h2>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-brand-primary/10 border border-brand-primary/20">
                            <ShieldCheck size={16} className="text-brand-primary" />
                            <span className="text-xs font-black uppercase tracking-widest text-brand-primary">🛡 Safety ON</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-gray-500">
                        <X size={28} />
                    </button>
                </div>

                <div className="bg-yellow-500/5 px-10 py-3 border-b border-yellow-500/10 flex items-center gap-3">
                    <AlertCircle size={14} className="text-yellow-500" />
                    <span className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-widest">
                        Protocol v1.0 가동 중: 모든 편집 내역은 투명하게 로깅되며 의료 가이드라인을 준수해야 합니다.
                    </span>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 border-r border-white/5">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className={`flex items-center gap-2 ${titleAuth.granted ? 'text-gray-500' : 'text-red-500/60'}`}>
                                    {titleAuth.granted ? <Pencil size={12} /> : <Lock size={12} />}
                                    <span className="text-[9px] font-black uppercase tracking-widest italic tracking-tighter">Dynamic Title Control</span>
                                </div>
                                <input
                                    value={title}
                                    readOnly={!titleAuth.granted}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full bg-transparent text-5xl font-black focus:outline-none placeholder-white/20 leading-tight ${titleAuth.granted ? 'text-white' : 'text-white/40 cursor-not-allowed'}`}
                                />
                                {!titleAuth.granted && <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest">SCALE 플랜 업그레이드가 필요합니다.</p>}
                            </div>

                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 w-fit group">
                                {slugAuth.granted ? <Link size={14} className="text-brand-primary" /> : <Lock size={14} className="text-gray-600" />}
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">URL Slug</span>
                                <input
                                    value={slug}
                                    readOnly={!slugAuth.granted}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className={`bg-transparent text-xs font-bold focus:outline-none w-48 ${slugAuth.granted ? 'text-brand-primary' : 'text-gray-700'}`}
                                />
                            </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        <div className="space-y-4">
                            <div className={`flex items-center gap-2 ${bodyAuth.granted ? 'text-gray-500' : 'text-red-500/60'}`}>
                                {bodyAuth.granted ? <MessageSquare size={12} /> : <Lock size={12} />}
                                <span className="text-[9px] font-black uppercase tracking-widest italic tracking-tighter">Full Content Operator</span>
                            </div>
                            <textarea
                                value={body}
                                readOnly={!bodyAuth.granted}
                                onChange={(e) => setBody(e.target.value)}
                                onBlur={(e) => handleBodyBlur(e.target.value)}
                                className={`w-full h-[600px] bg-transparent text-lg font-medium leading-relaxed p-0 full-textarea resize-none transition-all scrollbar-hide ${bodyAuth.granted ? 'text-white/90' : 'text-white/30 cursor-not-allowed'}`}
                            />
                        </div>
                    </div>

                    <div className="w-96 bg-white/[0.01] flex flex-col">
                        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">CTA Strategy</h3>
                                    {ctaAuth.granted ? <Zap size={16} className="text-brand-primary animate-pulse" /> : <Lock size={16} className="text-gray-600" />}
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        {CTA_TEMPLATES.map(tmpl => (
                                            <button
                                                key={tmpl.id}
                                                disabled={!ctaAuth.granted}
                                                onClick={() => {
                                                    setSelectedCta(tmpl);
                                                    setCtaText(tmpl.text);
                                                }}
                                                className={`p-3 rounded-xl border text-[10px] font-bold transition-all ${selectedCta.id === tmpl.id
                                                    ? 'bg-brand-primary/20 border-brand-primary text-brand-primary'
                                                    : 'bg-white/5 border-white/10 text-gray-500'
                                                    } ${!ctaAuth.granted && 'opacity-20 cursor-not-allowed'}`}
                                            >
                                                {tmpl.label}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={ctaText}
                                        readOnly={!ctaAuth.granted}
                                        onChange={(e) => setCtaText(e.target.value)}
                                        className={`w-full h-32 p-4 bg-black/40 border border-white/10 rounded-2xl text-xs font-medium focus:outline-none resize-none italic leading-relaxed ${ctaAuth.granted ? 'text-gray-300' : 'text-gray-700'}`}
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Scheduling</h3>
                                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Clock size={14} />
                                            <span className="text-[10px] font-bold">Publishing Time</span>
                                        </div>
                                        <button
                                            disabled={!scheduleAuth.granted}
                                            className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${scheduleAuth.granted ? 'text-brand-primary underline' : 'text-gray-700'}`}
                                        >
                                            {scheduleAuth.granted ? 'SET TIME' : 'LOCKED'} <ChevronDown size={12} />
                                        </button>
                                    </div>
                                    <div className="text-xl font-black italic">
                                        TOMORROW 08:30 <span className="text-[10px] text-gray-600 uppercase tracking-widest not-italic ml-2">(Auto-Optimized)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-white/5" />

                            <div className="p-6 rounded-3xl bg-brand-primary/5 border border-brand-primary/10">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShieldCheck size={16} className="text-brand-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Safety Intelligence</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold">
                                        <span className="text-gray-500 italic">Medical Risk Prob.</span>
                                        <span className="text-brand-primary">0.02% (極低)</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="w-[2%] h-full bg-brand-primary shadow-neon-sm" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-8 border-t border-white/5 bg-black/40 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={onClose} className="text-gray-500 hover:text-white font-bold text-sm tracking-widest transition-colors">CANCEL</button>
                        <button
                            onClick={() => handleSave(false)}
                            className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest"
                        >
                            임시 저장
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleSave(false)}
                            className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-sm uppercase tracking-widest flex items-center gap-2"
                        >
                            <Send size={18} className="text-gray-500" />
                            예약 발행
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            className="px-10 py-4 rounded-2xl bg-brand-primary text-black font-black uppercase text-sm tracking-widest hover:shadow-neon transition-all flex items-center gap-2"
                        >
                            즉시 발행
                            <CheckCircle2 size={20} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: 50, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: 50, x: '-50%' }}
                            className={`fixed bottom-12 left-1/2 px-8 py-5 rounded-[24px] border shadow-2x-neon z-[200] flex items-center gap-3 bg-black/80 backdrop-blur-xl ${toast.type === 'warning'
                                ? 'border-amber-500/30 text-amber-500'
                                : toast.type === 'success'
                                    ? 'border-green-500/30 text-green-500'
                                    : 'border-brand-primary/30 text-brand-primary'
                                }`}
                        >
                            {toast.type === 'warning' ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
                            <span className="text-sm font-black italic tracking-tight">{toast.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
