import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { useSlotStore } from '../../store/useSlotStore';
import { useProfileStore } from '../../store/useProfileStore';
import { useContentStore } from '../../store/useContentStore';
import { geminiReasoningService } from '../../services/geminiService';

type FlowState = 'PROGRESS_OVERVIEW' | 'CONTENT_GEN' | 'FINAL_CHECK';

interface SlotContentFlowProps {
    slotId: string;
    onComplete: () => void;
}

export const SlotContentFlow: React.FC<SlotContentFlowProps> = ({ slotId, onComplete }) => {
    const { getSlotById, advanceSlotIndex } = useSlotStore();
    const { clinicName, region } = useProfileStore();
    const slot = getSlotById(slotId);

    const [flowState, setFlowState] = useState<FlowState>('PROGRESS_OVERVIEW');
    const [currentContent, setCurrentContent] = useState<{ title: string; body: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    if (!slot) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500">슬롯을 찾을 수 없습니다.</p>
            </div>
        );
    }

    const currentIndex = slot.currentCluster.currentIndex;
    const currentTitle = currentIndex === 1
        ? slot.currentCluster.pillarTitle
        : slot.currentCluster.satelliteTitles[currentIndex - 2];

    // Generate content
    const handleGenerateContent = async () => {
        if (!currentTitle) {
            alert('주제를 찾을 수 없습니다. 슬롯 설정을 확인해주세요.');
            return;
        }
        setIsGenerating(true);
        setFlowState('CONTENT_GEN');
        try {
            const result = await geminiReasoningService.generateSlotContent({
                topicIndex: currentIndex,
                pillarTitle: slot.currentCluster.pillarTitle,
                currentTitle,
                persona: slot.personaSetting,
                clinicInfo: {
                    name: clinicName || '병원',
                    address: region || '',
                    phone: ''
                }
            });
            setCurrentContent(result);
            setFlowState('FINAL_CHECK');
        } catch (error: unknown) {
            console.error('Content generation error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === "API_KEY_MISSING") {
                alert("관리자 설정에서 Gemini API Key를 먼저 설정해주세요.");
            } else if (errorMessage === "USAGE_LIMIT_REACHED") {
                alert("원장님, 이번 달(또는 현재 등급)의 AI 생성 사용 한도에 도달했습니다.\n\n한도 증액이나 등급 상향은 관리자에게 문의해 주세요! 🚀");
            } else {
                alert('콘텐츠 생성 중 오류가 발생했습니다.');
            }
            setFlowState('PROGRESS_OVERVIEW');
        } finally {
            setIsGenerating(false);
        }
    };

    // Final publish handler
    const handlePublish = async () => {
        if (!currentContent) return;

        // 1. Copy to clipboard
        const copyText = `${currentContent.title}\n\n${currentContent.body}`;
        try {
            await navigator.clipboard.writeText(copyText);
            alert('전체 내용이 클립보드에 복사되었습니다. 블로그에 붙여넣기 하세요.');
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
        }

        // 2. Save to Content Store (Archive)
        const { addContent } = useContentStore.getState();
        addContent({
            title: currentContent.title,
            body: currentContent.body,
            status: 'PUBLISHED',
            riskCheckPassed: true,
            logs: []
        });

        // Advance slot index and close
        advanceSlotIndex(slotId);
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col overflow-hidden">
            {/* PROGRESS_OVERVIEW */}
            {flowState === 'PROGRESS_OVERVIEW' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 space-y-8"
                >
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-brand-primary">
                            {slot.slotName}
                        </h1>
                        <p className="text-gray-400 text-sm">
                            {slot.naverBlogId} · {slot.personaSetting.jobTitle}
                        </p>
                    </div>

                    <div className="w-full max-w-2xl space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-600">
                            Topic Cluster Progress
                        </h3>
                        <div className="grid grid-cols-10 gap-2">
                            {[...Array(10)].map((_, idx) => {
                                const topicNumber = idx + 1;
                                const isActive = topicNumber === currentIndex;
                                const isCompleted = topicNumber < currentIndex;
                                return (
                                    <div
                                        key={idx}
                                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all ${isCompleted
                                            ? 'bg-brand-primary text-black'
                                            : isActive
                                                ? 'bg-brand-primary/20 text-brand-primary border-2 border-brand-primary'
                                                : 'bg-white/5 text-gray-600'
                                            }`}
                                    >
                                        {isCompleted ? <CheckCircle2 size={16} /> : topicNumber}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 max-w-2xl w-full">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-3">
                            {currentIndex === 1 ? '📍 Pillar Post' : '🔗 Satellite Post'}
                        </p>
                        <h2 className="text-xl font-bold text-white mb-4">{currentTitle}</h2>
                        <button
                            onClick={handleGenerateContent}
                            disabled={isGenerating}
                            className="w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>AI 콘텐츠 생성 중...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    <span>이번 주제 글쓰기 시작</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* CONTENT_GEN (Loading) */}
            {flowState === 'CONTENT_GEN' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex items-center justify-center"
                >
                    <div className="text-center space-y-4">
                        <Loader2 size={48} className="animate-spin text-brand-primary mx-auto" />
                        <p className="text-xl font-bold">AI가 전문 콘텐츠를 작성하고 있습니다...</p>
                        <p className="text-sm text-gray-500">약 10초 정도 소요됩니다</p>
                    </div>
                </motion.div>
            )}

            {/* FINAL_CHECK */}
            {flowState === 'FINAL_CHECK' && currentContent && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col p-8 overflow-hidden relative"
                >
                    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-brand-primary">
                                Final Check
                            </h2>
                            <p className="text-gray-400 text-sm">콘텐츠를 검수하고 복사하여 발행하세요</p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-2">{currentContent.title}</h3>
                                <p className="text-sm text-gray-400 whitespace-pre-wrap">{currentContent.body}</p>
                            </div>

                            {/* Extra buttons removed for simplicity as requested */}
                        </div>

                        <button
                            onClick={handlePublish}
                            className="w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                        >
                            <ArrowRight size={18} />
                            <span>전체 글 복사</span>
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
