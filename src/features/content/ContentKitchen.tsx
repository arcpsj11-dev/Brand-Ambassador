import React, { useState } from 'react';
import { usePlannerStore } from '../../store/usePlannerStore';
import { useBrandStore } from '../../store/useBrandStore';
import { useChatStore } from '../../store/useChatStore';
import { useContentStore } from '../../store/useContentStore';
import { useStepStore } from '../../store/useStepStore';
import { Wand2, ArrowLeft, Target, FileText, CheckCircle2, Lock, Bot, ImageIcon, Send, Rocket } from 'lucide-react';
import { geminiReasoningService } from '../../services/geminiService';
import { RiskFilterEngine } from '../../services/RiskFilterEngine';
import { medicalRuleSet } from '../../services/MedicalRuleSet';
import { RiskCheckPanel } from './RiskCheckPanel';
import { SchedulePublish } from './SchedulePublish';

export const ContentKitchen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { activeDraft, updateDayStatus, setActiveDraft, persona } = usePlannerStore();
    const brand = useBrandStore();
    const chat = useChatStore();
    const contentStore = useContentStore();
    const { canAccess } = useStepStore();
    const canEditTitle = () => canAccess('editTitleFull', 'GROW').granted;

    const [content, setContent] = useState('');
    const [title, setTitle] = useState(activeDraft?.topic || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublished, setIsPublished] = useState(false);
    const [riskCheckResult, setRiskCheckResult] = useState<any>(null);

    // 리스크 필터 엔진 초기화
    const riskFilter = new RiskFilterEngine(medicalRuleSet);


    const handleGenerateDraft = async () => {
        if (!activeDraft || isGenerating) return;

        setIsGenerating(true);
        setContent(''); // 기존 내용 초기화 후 시작

        try {
            const stream = geminiReasoningService.generateStream(`페르소나: ${persona}\n주제: ${activeDraft.topic}`, {
                clinicName: brand.clinicName || '나노바나나',
                address: brand.address || '김포시 운양동',
                phoneNumber: brand.phoneNumber || '010-0000-0000',
                equipment: brand.equipment,
                facilities: brand.facilities,
                blogIndex: brand.blogIndex
            });

            let fullContent = '';
            for await (const chunk of stream) {
                fullContent += chunk;
                // 이미지 플레이스홀더를 제외한 나머지 [ ] 태그 제거
                // 로직상 [IMAGE_PLACEHOLDER: ...] 는 유지하고 [Collision] 등은 삭제
                const filteredContent = fullContent.replace(/\[(?!IMAGE_PLACEHOLDER).*?\]/g, '');
                setContent(filteredContent);
            }

            // 생성 완료 후 리스크 체크
            const result = riskFilter.checkContent(fullContent);
            setRiskCheckResult(result);
        } catch (error) {
            console.error("AI Generation Error:", error);
            setContent("원장님, 제니 엔진에 바나나 껍질이 끼었나 봐요! 💦 다시 한번만 시도해 주시겠어요?");
        } finally {
            setIsGenerating(false);
        }
    };


    const handlePublish = () => {
        if (!activeDraft || !content) return;
        setIsPublished(true);

        // Clean copy: Remove image placeholders for blog posting
        const cleanText = content.replace(/\[IMAGE_PLACEHOLDER:.*?\]/g, '').trim();
        navigator.clipboard.writeText(cleanText);

        setTimeout(() => {
            updateDayStatus(activeDraft.day, 'done');
            chat.addMessage({
                role: 'assistant',
                content: `축하드립니다 원장님! Day ${activeDraft.day} 글이 성공적으로 발행되었습니다. 클린 복사된 원고를 블로그에 그대로 붙여넣으세요! 🍌🏆`
            });
            onBack();
            setActiveDraft(null);
        }, 1500);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex justify-between items-center bg-black/40 backdrop-blur-xl p-6 rounded-3xl border border-white/5 sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => { onBack(); setActiveDraft(null); }}
                        className="p-3 hover:bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/10"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">Kitchen Mode: Active</span>
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none mt-1">
                            Content <span className="neon-text">Factory</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="glass-card px-4 py-2 border-brand-primary/20">
                        <span className="text-[10px] font-black text-brand-primary uppercase">Active Day:</span>
                        <span className="ml-2 font-black italic">#{activeDraft?.day || '00'}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Editor Area */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-10 space-y-8 bg-black/40 border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary/50 via-transparent to-brand-primary/50 opacity-20" />

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Target size={14} className="text-brand-primary" /> Content Title
                            </label>
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={!canEditTitle()}
                                className={`w-full bg-transparent text-4xl font-black italic border-b border-white/10 pb-4 outline-none focus:border-brand-primary transition-all placeholder:opacity-20 ${!canEditTitle() ? 'cursor-not-allowed opacity-50' : ''}`}
                                placeholder="제목을 입력하세요..."
                            />
                        </div>

                        <div className="space-y-4 min-h-[400px] flex flex-col">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={14} className="text-brand-primary" /> Body Composition
                                </label>
                            </div>
                            <button
                                onClick={handleGenerateDraft}
                                disabled={isGenerating}
                                className="w-full h-14 bg-brand-primary text-black font-black text-sm rounded-2xl flex items-center justify-center gap-3 hover:shadow-neon transition-all active:scale-95 disabled:opacity-50 disabled:grayscale group"
                            >
                                <Wand2 className={`${isGenerating ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} size={20} />
                                {isGenerating ? '원장님이 통찰력을 담아내고 있습니다... ✨' : '원장님 컨셉으로 블로그 원고 즉시 생성'}
                            </button>

                            <div className="flex-1 w-full relative group/editor overflow-hidden flex flex-col">
                                {isGenerating && !content && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse text-gray-500 italic z-10 bg-black/5 rounded-3xl">
                                        <Bot size={32} className="mb-4 text-brand-primary" />
                                        <p className="text-sm font-medium">원장님이 진심을 담아 원고를 쓰고 계세요... ✨</p>
                                    </div>
                                )}

                                <div className="flex-1 relative overflow-y-auto no-scrollbar min-h-[500px]">
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full min-h-[500px] bg-transparent text-gray-200 leading-[1.8] resize-none outline-none font-medium text-lg focus:text-white transition-colors placeholder:opacity-10 py-4 px-2"
                                        placeholder="제니의 인공지능 주방이 내용을 요리해 드릴까요?"
                                    />

                                    {/* 이미지 삽입 가이드 레이어 (UI에만 버튼으로 표시) */}
                                    <div className="pointer-events-none pb-10">
                                        {content.split('\n').map((line, idx) => {
                                            if (line.includes('[IMAGE_PLACEHOLDER')) {
                                                const desc = line.match(/\[IMAGE_PLACEHOLDER: (.*?)\]/)?.[1] || '관련 이미지';
                                                return (
                                                    <div key={idx} className="my-6 pointer-events-auto group/slot">
                                                        <div className="w-full h-16 bg-brand-primary/5 hover:bg-brand-primary/10 border border-dashed border-brand-primary/20 rounded-2xl flex items-center justify-between px-6 transition-all group-hover/slot:border-brand-primary/40 cursor-help">
                                                            <div className="flex items-center gap-4">
                                                                <div className="p-2.5 bg-brand-primary/20 rounded-xl text-brand-primary">
                                                                    <ImageIcon size={20} />
                                                                </div>
                                                                <div className="text-left">
                                                                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Recommended Image Spot</p>
                                                                    <p className="text-xs text-gray-400 font-bold italic">"{desc}"</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-white/5 px-3 py-1.5 rounded-xl bg-white/5">
                                                                Visual Guide Only
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] text-gray-600 mt-2 font-black uppercase tracking-widest italic ml-1">
                                                            * This guide will be auto-removed upon copying for blog.
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>

                                {isGenerating && content && (
                                    <div className="flex items-center gap-2 text-brand-primary animate-pulse ml-1 py-4 border-t border-white/5 mt-4">
                                        <div className="w-1.5 h-1.5 bg-brand-primary rounded-full" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">원장님이 정성껏 원고를 검토 중입니다...</span>
                                    </div>
                                )}
                            </div>

                            {/* Brand Footer - Premium Card Design */}
                            <div className="mt-12 group">
                                <div className="glass-card p-8 bg-gradient-to-br from-brand-primary/10 to-transparent border-brand-primary/20 relative overflow-hidden flex justify-between items-end">
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center gap-2 text-brand-primary">
                                            <CheckCircle2 size={18} className="animate-pulse" />
                                            <h4 className="font-black text-xs uppercase tracking-[0.2em] italic">Official Brand Memory</h4>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-2xl font-black text-white italic tracking-tighter uppercase">도담한의원</p>
                                            <div className="flex flex-col gap-1.5 text-[11px] text-gray-400 font-medium">
                                                <p className="flex items-center gap-2">
                                                    <span className="text-brand-primary font-black opacity-30">ADR.</span>
                                                    김포시 김포한강1로 227 광장프라자 311호
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <span className="text-brand-primary font-black opacity-30">TEL.</span>
                                                    031-988-1575
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="bg-brand-primary text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-neon-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group-hover:shadow-neon relative z-10">
                                        <Send size={14} />
                                        실시간 상담하기
                                    </button>

                                    {/* Decorative Background Element */}
                                    <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Bot size={160} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Strategy & Tools Area */}
                        <div className="space-y-6">
                            <div className="glass-card p-6 space-y-4 border-brand-primary/20 bg-brand-primary/5">
                                <div className="flex items-center gap-2 text-brand-primary">
                                    <Target size={18} />
                                    <h3 className="font-black text-sm uppercase tracking-tighter italic">Strategy Intel</h3>
                                </div>
                                <div className="space-y-4 group">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-gray-500 font-black uppercase">Current Mood</span>
                                        <span className="text-brand-primary">TRUST ARCHITECT ACTIVE</span>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                        <p className="text-[11px] font-black text-yellow-500 uppercase tracking-widest">Human-Core Value</p>
                                        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                                            가상의 장비보다는 원장님의 숙련도와 의료진의 정성을 강조합니다.
                                            통증의 원인을 끝까지 추적하는 집요함을 원고에 녹여내세요.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6 space-y-6">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Wand2 size={18} />
                                    <h3 className="font-black text-sm uppercase tracking-tighter italic">Neural Lab Tools</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 opacity-40 cursor-not-allowed">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-white/5 rounded-xl text-gray-500">
                                                <ImageIcon size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Image Lab</p>
                                                <p className="font-black text-xs italic tracking-tighter uppercase">DALL-E 3 Simulation</p>
                                            </div>
                                        </div>
                                        <ArrowLeft className="rotate-180 text-gray-700" size={16} />
                                    </button>

                                    <button className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 opacity-40 cursor-not-allowed">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-white/5 rounded-xl text-gray-500">
                                                <Send size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Smart Hub</p>
                                                <p className="font-black text-xs italic tracking-tighter uppercase">Direct To Naver</p>
                                            </div>
                                        </div>
                                        <Lock size={16} className="text-gray-700" />
                                    </button>
                                </div>
                            </div>

                            {/* 리스크 체크 패널 */}
                            {riskCheckResult && (
                                <RiskCheckPanel
                                    result={riskCheckResult}
                                    onRecheck={() => {
                                        const result = riskFilter.checkContent(content);
                                        setRiskCheckResult(result);
                                    }}
                                />
                            )}

                            {/* 예약 발행 시스템 */}
                            {content && riskCheckResult?.passed && (
                                <SchedulePublish
                                    onSchedule={(date) => {
                                        // 콘텐츠 저장
                                        contentStore.addContent({
                                            title,
                                            body: content,
                                            status: 'SCHEDULED',
                                            riskCheckPassed: true,
                                            riskCheckResults: riskCheckResult,
                                            scheduledPublishAt: date,
                                            logs: []
                                        });
                                        chat.addMessage({
                                            role: 'assistant',
                                            content: `원장님! 콘텐츠가 ${date.toLocaleString('ko-KR')}에 발행 예약되었습니다. 🎯`,
                                        });
                                    }}
                                />
                            )}

                            <button
                                onClick={handlePublish}
                                disabled={isPublished || !content || !riskCheckResult?.passed}
                                className={`w-full p-6 rounded-3xl font-black text-xl italic uppercase tracking-tighter transition-all flex flex-col items-center justify-center gap-1 group relative overflow-hidden shadow-[0_20px_50px_rgba(234,179,8,0.2)] ${isPublished || !content ? 'bg-gray-800 text-gray-600 grayscale' : 'bg-brand-primary text-black hover:scale-105 active:scale-95'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {isPublished ? <CheckCircle2 size={24} className="animate-in zoom-in" /> : <Rocket size={24} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />}
                                    {isPublished ? '원고 복사 완료!' : '블로그 게시용 복사'}
                                </div>
                                {!isPublished && <span className="text-[9px] font-black opacity-50 uppercase tracking-widest">Clean Copy: No Tags</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
