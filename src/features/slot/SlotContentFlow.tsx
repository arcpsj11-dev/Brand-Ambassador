import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Sparkles,
    CheckCircle2,
    Download,
    AlertTriangle,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { useSlotStore } from '../../store/useSlotStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useProfileStore } from '../../store/useProfileStore';
import { useContentStore } from '../../store/useContentStore';
import { geminiReasoningService } from '../../services/geminiService';

type FlowState = 'PROGRESS_OVERVIEW' | 'CONTENT_GEN' | 'IMAGE_PROMPT' | 'IMAGE_GEN' | 'VIDEO_STUDIO' | 'FINAL_CHECK';

interface SlotContentFlowProps {
    slotId: string;
    onComplete: () => void;
}

export const SlotContentFlow: React.FC<SlotContentFlowProps> = ({ slotId, onComplete }) => {
    const { getSlotById, advanceSlotIndex } = useSlotStore();
    const { user } = useAuthStore();
    const { clinicName, region } = useProfileStore();
    const slot = getSlotById(slotId);

    const [flowState, setFlowState] = useState<FlowState>('PROGRESS_OVERVIEW');
    const [currentContent, setCurrentContent] = useState<{ title: string; body: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Image & Video states
    const [imagePrompts, setImagePrompts] = useState<string[]>([]);
    const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
    const [mediaAssets, setMediaAssets] = useState<{ images: string[] } | null>(null);
    const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);

    // Tier limits
    const getTierLimits = () => {
        const tier = user?.tier || 'START';
        switch (tier) {
            case 'SCALE': return { maxImages: 8, hasVideo: true, model: 'flux' };
            case 'GROW': return { maxImages: 4, hasVideo: true, model: 'flux' };
            default: return { maxImages: 1, hasVideo: false, model: 'turbo' };
        }
    };
    const limits = getTierLimits();

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
            setFlowState('IMAGE_PROMPT');
        } catch (error) {
            console.error('Content generation error:', error);
            alert('콘텐츠 생성 중 오류가 발생했습니다.');
            setFlowState('PROGRESS_OVERVIEW');
        } finally {
            setIsGenerating(false);
        }
    };

    // Extract image prompts
    const handleExtractPrompts = async () => {
        if (!currentContent) return;
        setIsGeneratingPrompts(true);
        try {
            let prompts = await geminiReasoningService.generateImagePrompts(currentContent.body);
            prompts = prompts.slice(0, limits.maxImages);
            setImagePrompts(prompts);
        } catch (error) {
            console.error('Prompt extraction error:', error);
            setImagePrompts([
                "Modern medical clinic interior, photorealistic, 8k",
                "Doctor consulting patient, warm lighting, high detail",
                "Acupuncture therapy, cinematic lighting",
                "Clean herbal medicine room, 8k"
            ].slice(0, limits.maxImages));
        } finally {
            setIsGeneratingPrompts(false);
        }
    };

    // Auto-extract prompts when entering IMAGE_PROMPT state
    useEffect(() => {
        if (flowState === 'IMAGE_PROMPT' && imagePrompts.length === 0) {
            handleExtractPrompts();
        }
    }, [flowState]);

    // Generate all images
    const handleGenerateImages = async () => {
        if (imagePrompts.length === 0) return;
        setIsGeneratingMedia(true);
        try {
            const mod = await import('../../services/mediaGenerationService');
            const urls = await Promise.all(
                imagePrompts.map((p, i) => mod.generateNanoBananaImage(p, i, limits.model as any))
            );
            setMediaAssets({ images: urls });
            setFlowState('IMAGE_GEN');
        } catch (error) {
            console.error('Image generation error:', error);
            alert('이미지 생성 중 오류가 발생했습니다.');
        } finally {
            setIsGeneratingMedia(false);
        }
    };

    // Regenerate single image
    const regenerateImage = async (index: number) => {
        if (!mediaAssets) return;
        try {
            const prompt = imagePrompts[index] || "Modern clinic scene";
            const newUrl = await import('../../services/mediaGenerationService')
                .then(m => m.generateNanoBananaImage(prompt, index, limits.model as any));
            const newImages = [...mediaAssets.images];
            newImages[index] = newUrl;
            setMediaAssets({ ...mediaAssets, images: newImages });
        } catch (error) {
            console.error('Image regeneration error:', error);
        }
    };

    // Final publish handler
    const handlePublish = async () => {
        if (!currentContent) return;

        setIsRecordingVideo(true);

        // 1. Save to Content Store (Archive)
        const { addContent } = useContentStore.getState();
        addContent({
            title: currentContent.title,
            body: currentContent.body,
            status: 'PUBLISHED',
            riskCheckPassed: true,
            logs: []
        });

        // 2. Download images
        if (mediaAssets && mediaAssets.images.length > 0) {
            for (let i = 0; i < mediaAssets.images.length; i++) {
                try {
                    const response = await fetch(mediaAssets.images[i]);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${slot.slotName}_image_${i + 1}.webp`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } catch (err) {
                    console.error('Image download failed', err);
                }
            }

            // Generate video (if tier allows)
            if (limits.hasVideo) {
                try {
                    const mod = await import('../../services/mediaGenerationService');
                    const videoBlob = await mod.createSlideVideo(mediaAssets.images);
                    const url = window.URL.createObjectURL(videoBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
                    a.download = `${slot.slotName}_video.${ext}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } catch (err) {
                    console.error('Video generation failed', err);
                    alert('영상 파일 생성 중 오류가 발생했습니다.');
                }
            }
        }

        // Advance slot index and close
        advanceSlotIndex(slotId);
        setIsRecordingVideo(false);
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

            {/* IMAGE_PROMPT */}
            {flowState === 'IMAGE_PROMPT' && currentContent && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col p-8 overflow-hidden"
                >
                    <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-brand-primary">
                                Image Prompt Editor
                            </h2>
                            <p className="text-gray-400 text-sm">
                                AI가 추출한 영문 프롬프트를 확인하고 수정하세요
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {isGeneratingPrompts ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 size={32} className="animate-spin text-brand-primary" />
                                </div>
                            ) : (
                                imagePrompts.map((prompt, idx) => (
                                    <div key={idx} className="relative">
                                        <div className="absolute -left-3 top-3 w-6 text-[10px] font-black text-gray-600 text-right">
                                            {idx + 1}
                                        </div>
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => {
                                                const newPrompts = [...imagePrompts];
                                                newPrompts[idx] = e.target.value;
                                                setImagePrompts(newPrompts);
                                            }}
                                            className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-300 focus:border-brand-primary focus:ring-0 focus:bg-white/10 transition-all resize-none leading-relaxed"
                                            placeholder="Waiting for AI..."
                                        />
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setFlowState('PROGRESS_OVERVIEW')}
                                className="flex-1 py-4 rounded-xl border border-white/10 text-gray-400 font-bold uppercase hover:bg-white/5 transition-all"
                            >
                                나중에 하기
                            </button>
                            <button
                                onClick={handleGenerateImages}
                                disabled={isGeneratingMedia || imagePrompts.length === 0}
                                className="flex-1 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isGeneratingMedia ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span>생성 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>이미지 {imagePrompts.length}장 생성</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* IMAGE_GEN */}
            {flowState === 'IMAGE_GEN' && mediaAssets && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col p-8 overflow-hidden"
                >
                    <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-brand-primary">
                                AI Studio
                            </h2>
                            <p className="text-gray-400 text-sm">생성된 이미지를 확인하세요</p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {mediaAssets.images.map((img, idx) => (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50 relative group">
                                        <img
                                            src={img}
                                            className="w-full h-full object-cover"
                                            alt={`Generated ${idx}`}
                                            onError={(e) => {
                                                e.currentTarget.src = "https://placehold.co/400x400/1a1a1a/666666?text=LIMIT+REACHED";
                                                e.currentTarget.onerror = null;
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                            <button
                                                onClick={() => regenerateImage(idx)}
                                                className="p-3 rounded-full bg-brand-primary text-black hover:scale-110 transition-all"
                                                title="재생성"
                                            >
                                                <RefreshCw size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {limits.hasVideo ? (
                                <button
                                    onClick={() => setFlowState('VIDEO_STUDIO')}
                                    className="flex-1 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                >
                                    <span>영상 스튜디오로 이동</span>
                                    <ArrowRight size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setFlowState('FINAL_CHECK')}
                                    className="flex-1 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                >
                                    <span>최종 검수 단계로</span>
                                    <ArrowRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* VIDEO_STUDIO */}
            {flowState === 'VIDEO_STUDIO' && mediaAssets && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 space-y-8"
                >
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-brand-primary">
                            Video Preview
                        </h2>
                        <p className="text-gray-400 text-sm mt-2">슬라이드 쇼 미리보기</p>
                    </div>

                    <div className="relative aspect-[9/16] h-[55vh] rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl bg-black">
                        <div className="absolute inset-0 flex">
                            {mediaAssets.images.slice(0, 4).map((img, idx) => (
                                <motion.img
                                    key={idx}
                                    src={img}
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: [0, 1, 1, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        delay: idx * 4,
                                        times: [0, 0.1, 0.9, 1]
                                    }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => setFlowState('FINAL_CHECK')}
                        className="px-12 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center gap-3"
                    >
                        <span>최종 검수 및 발행</span>
                        <ArrowRight size={18} />
                    </button>
                </motion.div>
            )}

            {/* FINAL_CHECK */}
            {flowState === 'FINAL_CHECK' && currentContent && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col p-8 overflow-hidden relative"
                >
                    <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-brand-primary">
                                Final Check
                            </h2>
                            <p className="text-gray-400 text-sm">콘텐츠를 검수하고 네이버 블로그에 발행하세요</p>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-2">{currentContent.title}</h3>
                                <p className="text-sm text-gray-400 whitespace-pre-wrap">{currentContent.body}</p>
                            </div>

                            <button
                                onClick={() => {
                                    const copyText = `${currentContent.title}\n\n${currentContent.body}`;
                                    navigator.clipboard.writeText(copyText).then(() => {
                                        alert('콘텐츠가 클립보드에 복사되었습니다!');
                                    });
                                }}
                                className="w-full py-3 rounded-xl border border-brand-primary/20 text-brand-primary font-bold uppercase hover:bg-brand-primary/10 transition-all"
                            >
                                📋 텍스트 복사
                            </button>

                            <button
                                onClick={() => window.open(`https://blog.naver.com/${slot.naverBlogId}/postwrite`, '_blank')}
                                className="w-full py-3 rounded-xl border border-brand-primary/20 text-brand-primary font-bold uppercase hover:bg-brand-primary/10 transition-all"
                            >
                                🚀 네이버 블로그 열기
                            </button>
                        </div>

                        <button
                            onClick={handlePublish}
                            disabled={isRecordingVideo}
                            className={`w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3 ${isRecordingVideo ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            <Download size={18} />
                            <span>{isRecordingVideo ? '저장 중...' : '미디어 저장 및 발행 완료'}</span>
                        </button>
                    </div>

                    {isRecordingVideo && (
                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-6">
                            <div className="w-20 h-20 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon" />
                            <div className="text-center space-y-2">
                                <p className="text-brand-primary text-xl font-black uppercase tracking-widest animate-pulse">
                                    미디어 다운로드 중
                                </p>
                                <p className="text-gray-500 text-sm">잠시만 기다려주세요...</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};
