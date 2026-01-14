import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContentStore } from '../../store/useContentStore';
import { useBrandStore } from '../../store/useBrandStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useStepStore } from '../../store/useStepStore';
import {
    FileText,
    Download,
    Image as ImageIcon,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Lock,
    Sparkles,
    ShieldCheck,
    ArrowRight,
    Search
} from 'lucide-react';
import { DEFAULT_TEMPLATES, renderTemplate, type OPGTemplate } from './opg-templates';
import { pdfExporter } from '../../services/PDFExporter';
import { RiskFilterEngine } from '../../services/RiskFilterEngine';
import { medicalRuleSet } from '../../services/MedicalRuleSet';

export const OPGConverter: React.FC = () => {
    const { user } = useAuthStore();
    const { canAccess, currentStep } = useStepStore();
    const contentStore = useContentStore();
    const brand = useBrandStore();
    const riskFilter = new RiskFilterEngine(medicalRuleSet);

    const plan = user?.tier || 'START';
    const auth = canAccess('accessOPG', plan);

    const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<OPGTemplate>(DEFAULT_TEMPLATES[0]);
    const [isConverting, setIsConverting] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // PUBLISHED 상태의 콘텐츠만 가져오기
    const publishedContents = contentStore.getContentsByStatus('PUBLISHED')
        .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

    const summarizeContent = (content: string): string => {
        const cleanContent = content.replace(/\[IMAGE_PLACEHOLDER:.*?\]/g, '').trim();
        return cleanContent.length > 300 ? cleanContent.substring(0, 300) + '...' : cleanContent;
    };

    const handleGenerate = () => {
        if (!selectedContentId) return;

        const content = contentStore.getContentById(selectedContentId);
        if (!content) return;

        const riskResult = riskFilter.checkContent(content.body);
        if (!riskResult.passed) {
            alert('이 콘텐츠는 의료법 위반 가능성이 있어 홍보물로 변환할 수 없습니다.\n본문을 안전하게 수정한 후 다시 시도해 주세요.');
            return;
        }

        setIsConverting(true);

        setTimeout(() => {
            const summary = summarizeContent(content.body);
            const html = renderTemplate(selectedTemplate, {
                title: content.title,
                clinicName: brand.clinicName || '제니한의원',
                content: summary,
                address: brand.address || '대한민국 어딘가',
                phone: brand.phoneNumber || '010-0000-0000',
            });

            setPreviewHtml(html);
            setIsConverting(false);
        }, 800);
    };

    const handleDownloadPDF = async () => {
        if (!previewHtml) return;
        try {
            await pdfExporter.exportToPDF(previewHtml, `OPG_${selectedTemplate.name}.pdf`);
        } catch (error) {
            alert('PDF 생성 중 오류가 발생했습니다.');
        }
    };

    const handleDownloadImage = async () => {
        if (!previewHtml) return;
        try {
            await pdfExporter.exportToImage(previewHtml, `OPG_${selectedTemplate.name}.png`);
        } catch (error) {
            alert('이미지 생성 중 오류가 발생했습니다.');
        }
    };

    if (!auth.granted) {
        return (
            <div className="h-[70vh] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl w-full glass-card p-12 text-center space-y-8 border-brand-primary/20 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent" />

                    <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-brand-primary/20">
                        <Lock size={40} className="text-brand-primary" />
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl font-black italic uppercase tracking-tight">
                            OPG Module Locked
                        </h2>
                        <div className="flex items-center justify-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${auth.reason === 'PLAN' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'}`}>
                                {auth.reason === 'PLAN' ? 'Plan Restriction' : 'Trust Level Deficiency'}
                            </span>
                        </div>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            {auth.reason === 'PLAN'
                                ? '원내 홍보물 생성 모듈(OPG)은 GROW 플랜 이상에서 사용 가능합니다. 블로그 콘텐츠를 오프라인 성과로 전환해 보세요.'
                                : '시스템 운영 신뢰도(STEP 2)가 아직 달성되지 않았습니다. 3회 이상의 성공적인 블로그 발행 후 기능이 자동 해금됩니다.'}
                        </p>
                    </div>

                    {auth.reason === 'PLAN' ? (
                        <button className="w-full py-4 rounded-2xl bg-brand-primary text-black font-black uppercase tracking-widest hover:shadow-neon transition-all flex items-center justify-center group">
                            GROW 플랜으로 업그레이드
                            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-500 font-bold uppercase tracking-widest">
                            STATUS: STEP {currentStep} · NEEDS 3+ PUBLISHES
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <header className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={12} /> OPG Intelligence
                    </div>
                    <div className="px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[9px] font-black uppercase tracking-widest">
                        {plan} PLAN ENABLED
                    </div>
                </div>
                <h1 className="text-5xl font-black neon-text uppercase italic tracking-tighter leading-none">
                    Online to Print<br />Generator
                </h1>
                <p className="text-gray-500 font-medium">
                    AI가 분석한 블로그의 핵심 내용을 기반으로 가독성이 높은 원내 홍보물을 즉시 생성합니다.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-xs uppercase tracking-widest text-brand-primary">
                                Select Source Content
                            </h3>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search published..."
                                    className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[10px] focus:outline-none focus:border-brand-primary/40 w-40"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                            {publishedContents.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                                    <FileText size={40} className="mx-auto mb-3 text-gray-700" />
                                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">No published articles yet</p>
                                </div>
                            ) : (
                                publishedContents.map((content) => (
                                    <button
                                        key={content.id}
                                        onClick={() => setSelectedContentId(content.id)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all group ${selectedContentId === content.id
                                            ? 'bg-brand-primary/10 border-brand-primary/40 shadow-neon-sm'
                                            : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className={`font-black text-sm truncate ${selectedContentId === content.id ? 'text-brand-primary' : 'text-gray-300'}`}>
                                                    {content.title}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                                    <span>{new Date(content.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-brand-primary/40">·</span>
                                                    <span className="flex items-center gap-1 text-blue-500/60">
                                                        <ShieldCheck size={10} /> Verified
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${selectedContentId === content.id ? 'bg-brand-primary text-black border-brand-primary' : 'bg-black/20 border-white/5 text-gray-600 group-hover:text-white'}`}>
                                                <ArrowRight size={14} />
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-6 space-y-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-brand-primary">
                            Visual Layout Style
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {DEFAULT_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => setSelectedTemplate(template)}
                                    className={`relative p-4 rounded-2xl border transition-all text-left overflow-hidden group ${selectedTemplate.id === template.id
                                        ? 'bg-brand-primary/10 border-brand-primary shadow-neon-sm'
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex flex-col gap-3 relative z-10">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedTemplate.id === template.id ? 'bg-brand-primary text-black' : 'bg-white/5 text-gray-500'}`}>
                                            <ImageIcon size={20} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black uppercase tracking-tight ${selectedTemplate.id === template.id ? 'text-brand-primary' : 'text-gray-300'}`}>{template.name}</p>
                                            <p className="text-[10px] text-gray-600 font-bold">{template.size} DIMENSION</p>
                                        </div>
                                    </div>
                                    {selectedTemplate.id === template.id && (
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle size={14} className="text-brand-primary" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!selectedContentId || isConverting}
                        className="w-full py-6 rounded-3xl bg-brand-primary text-black font-black text-lg uppercase tracking-widest hover:shadow-neon transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
                    >
                        {isConverting ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                analyzing strategy...
                            </>
                        ) : (
                            <>
                                <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                                Generate Print Materials
                            </>
                        )}
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-8 bg-black/40 border-white/5 flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-8">
                            <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">
                                Output Preview
                            </h3>
                            {previewHtml && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black text-green-500 uppercase tracking-widest">
                                    <ShieldCheck size={14} /> Ready for Production
                                </span>
                            )}
                        </div>

                        <div className="w-full aspect-[210/297] bg-white rounded-lg shadow-2xl relative group overflow-hidden">
                            {previewHtml ? (
                                <iframe
                                    srcDoc={previewHtml}
                                    className="w-full h-full border-0"
                                    title="OPG Preview"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-800 bg-gray-50">
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-gray-200/50 rounded-full flex items-center justify-center mx-auto">
                                            <FileText size={40} className="text-gray-300" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-black text-gray-300 uppercase tracking-widest italic">Waiting for Input</p>
                                            <p className="text-[10px] text-gray-400 font-bold">Select a post to start conversion</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <AnimatePresence>
                        {previewHtml && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <button
                                    onClick={handleDownloadPDF}
                                    className="px-8 py-5 rounded-3xl bg-red-600 text-white font-black uppercase text-sm tracking-widest hover:bg-red-500 hover:shadow-lg transition-all flex items-center justify-center gap-3"
                                >
                                    <Download size={20} />
                                    Save as PDF
                                </button>
                                <button
                                    onClick={handleDownloadImage}
                                    className="px-8 py-5 rounded-3xl bg-blue-600 text-white font-black uppercase text-sm tracking-widest hover:bg-blue-500 hover:shadow-lg transition-all flex items-center justify-center gap-3"
                                >
                                    <ImageIcon size={20} />
                                    Export Image
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
