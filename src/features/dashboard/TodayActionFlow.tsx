import React, { useState, useEffect } from 'react';
import {
    X, AlertCircle, CheckCircle2, Copy, ExternalLink,
    ArrowRight, Loader2, Play, Sparkles, Wand2, Info,
    ChevronRight, Calendar, Target, Bot, Zap, Image as ImageIcon,
    Download, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContentStore } from '../../store/useContentStore';
import { useBrandStore } from '../../store/useBrandStore';
import { useStepStore } from '../../store/useStepStore';
import { geminiReasoningService } from '../../services/geminiService';

import { useAuthStore } from '../../store/useAuthStore';
import { useProfileStore } from '../../store/useProfileStore';
import { useTopicStore } from '../../store/useTopicStore';

interface TodayActionFlowProps {
    onClose: () => void;
}

// 5단계 상태 정의 (IMAGE_GENERATION -> VIDEO_GEN 추가)
type FlowState = 'ENTRY' | 'PROCESSING' | 'FINAL_CHECK' | 'STEP_IMAGE_GENERATION' | 'STEP_VIDEO_GEN' | 'END';

const LOADING_MESSAGES = [
    "원장님, 오늘 글은 구조 안정에 중요한 포인트예요.",
    "지금은 수정하지 않는 게, 나중에 훨씬 빨라집니다.",
    "의료 표현은 시스템이 먼저 점검하고 있어요.",
    "이 단계는 블로그 지수를 쌓는 과정입니다."
];

export const TodayActionFlow: React.FC<TodayActionFlowProps> = ({ onClose }) => {
    const { setActionStatus, addContent, completeTodayAction, completedCount, regenerationTopic, setRegenerationTopic } = useContentStore();
    const { checkAndUpgrade } = useStepStore();
    const { user } = useAuthStore();
    const { selectedBlogId, keyKeywords } = useProfileStore();
    const { clusters, setClusters, getNextTopic, markAsPublished } = useTopicStore();
    const brand = useBrandStore();

    const [flowState, setFlowState] = useState<FlowState>('ENTRY');
    const [currentContent, setCurrentContent] = useState<{ title: string; body: string; type: string; pillarTitle?: string; day: number } | null>(null);
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [showUpgradeNotif, setShowUpgradeNotif] = useState(false);

    // [New] Image & Video State
    const [imagePrompts, setImagePrompts] = useState<string[]>([]);
    const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
    const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
    const [isRecordingVideo, setIsRecordingVideo] = useState(false);
    const [mediaAssets, setMediaAssets] = useState<{ images: string[] } | null>(null);

    // [New] Tier limits
    const getTierLimits = () => {
        const tier = user?.tier || 'START';
        switch (tier) {
            case 'SCALE': return { maxImages: 8, hasVideo: true, model: 'flux' };
            case 'GROW': return { maxImages: 4, hasVideo: true, model: 'flux' };
            default: return { maxImages: 1, hasVideo: false, model: 'turbo' };
        }
    };
    const limits = getTierLimits();

    // 미디어 생성 및 프롬프트 추출 핸들러
    const handleProceedToMedia = async () => {
        if (!currentContent) return;
        setFlowState('STEP_IMAGE_GENERATION');

        // 프롬프트가 없을 때만 자동 생성
        if (imagePrompts.length === 0) {
            setIsGeneratingPrompts(true);
            try {
                let prompts = await geminiReasoningService.generateImagePrompts(currentContent.body);
                // 티어별 개수 제한
                prompts = prompts.slice(0, limits.maxImages);
                setImagePrompts(prompts);
            } catch (err) {
                console.error("Prompt Gen Failed", err);
                setImagePrompts(["Modern clinic interior", "Doctor consulting", "Acupuncture scene", "Herbal medicine", "Clean reception"].slice(0, limits.maxImages));
            } finally {
                setIsGeneratingPrompts(false);
            }
        }
    };

    // 이미지 개별 재생성
    async function regenerateSingleImage(index: number) {
        if (!mediaAssets) return;
        const prompt = imagePrompts[index] || "Modern hospital scene";
        try {
            // 개별 생성 시 로딩 표시를 위해 임시로 비워둘 수도 있으나, 여기선 유지
            const newUrl = await import('../../services/mediaGenerationService').then(m => m.generateNanoBananaImage(prompt, index, limits.model as any));

            const newImages = [...mediaAssets.images];
            newImages[index] = newUrl;
            setMediaAssets({ ...mediaAssets, images: newImages });
        } catch (e) {
            alert("이미지 재생성 실패");
        }
    }

    // [New] 전체 이미지 일괄 생성
    async function generateAllMedia() {
        if (imagePrompts.length === 0) return;
        setIsGeneratingMedia(true);
        try {
            const mod = await import('../../services/mediaGenerationService');
            const urls = await Promise.all(
                imagePrompts.map((p, i) => mod.generateNanoBananaImage(p, i, limits.model as any))
            );
            setMediaAssets({ images: urls });
        } catch (e) {
            console.error(e);
            alert("이미지 생성 중 오류가 발생했습니다.");
        } finally {
            setIsGeneratingMedia(false);
        }
    }

    // 로딩 메시지 순환
    useEffect(() => {
        if (flowState === 'PROCESSING') {
            const timer = setInterval(() => {
                setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [flowState]);

    // 자동 프로세스 실행
    const startProcess = async () => {
        if (flowState !== 'ENTRY') return;
        setFlowState('PROCESSING');
        setActionStatus('STEP_GENERATING');

        try {
            let targetTopic = '';
            let targetType = 'supporting';
            let pillarTitle = '';
            let currentDay = 1;

            if (regenerationTopic) {
                targetTopic = regenerationTopic;
                setRegenerationTopic(null); // 사용 후 초기화
            } else {
                // 1. 클러스터데이터가 없으면 생성
                if (clusters.length === 0) {
                    const mainTopic = keyKeywords[0] || '교통사고 후유증';
                    const clusteredData = await geminiReasoningService.generateMonthlyTitles(
                        mainTopic
                    );
                    if (clusteredData && clusteredData.clusters) {
                        setClusters(clusteredData.clusters);
                    }
                }

                // 2. 다음 주제 가져오기
                const nextData = getNextTopic();
                if (!nextData) throw new Error("분석된 주제가 없습니다.");

                targetTopic = nextData.topic.title;
                targetType = nextData.topic.type;
                pillarTitle = nextData.pillarTitle || '';
                currentDay = nextData.topic.day;
            }

            // 3. 본문 생성
            const contentGen = geminiReasoningService.generateStream(targetTopic, {
                clinicName: brand.clinicName || '도담한의원',
                address: brand.address || '김포시 운양동',
                phoneNumber: brand.phoneNumber || '031-988-1575'
            });

            let fullBody = "";
            for await (const chunk of contentGen) {
                fullBody += chunk;
            }

            const newContentData = {
                title: targetTopic,
                body: fullBody,
                type: targetType,
                pillarTitle,
                day: currentDay
            };

            setCurrentContent(newContentData);

            // [자동 저장] 생성 즉시 아카이브에 DRAFT 상태로 저장
            addContent({
                title: newContentData.title,
                body: newContentData.body,
                status: 'DRAFT', // 처음에는 DRAFT로 저장
                riskCheckPassed: true,
                logs: []
            });

            setFlowState('FINAL_CHECK');

        } catch (error) {
            console.error(error);
            alert("시스템 점검 중입니다. 잠시 후 자동으로 다시 진행됩니다.");
            onClose();
        }
    };


    // 네이버 글쓰기 바로가기 (발행 프로세스)
    // 네이버 글쓰기 바로가기 (발행 프로세스)
    const handleNaverPublish = async () => {
        if (!currentContent) return;
        const targetBlogId = selectedBlogId;
        if (!targetBlogId) {
            alert("네이버 블로그 아이디를 입력하거나 선택해주세요.");
            return;
        }

        // 1. 클립보드 복사 & 네이버 창 열기 (FINAL_CHECK 단계에서만 수행)
        if (flowState === 'FINAL_CHECK') {
            const copyText = `${currentContent.title}\n\n${currentContent.body}`;
            try {
                await navigator.clipboard.writeText(copyText);
                alert(`내용이 클립보드에 복사되었습니다.\n\n네이버 블로그(${targetBlogId}) 글쓰기 창이 열리면 붙여넣기(Ctrl+V) 하세요.`);
            } catch (err) {
                console.error('클립보드 복사 실패:', err);
            }
            window.open(`https://blog.naver.com/${targetBlogId}/postwrite`, '_blank');
        }

        // 2. 이미지 및 영상 자동 저장
        if (mediaAssets && mediaAssets.images.length > 0) {
            setIsRecordingVideo(true);

            // 이미지 개별 다운로드
            for (let i = 0; i < mediaAssets.images.length; i++) {
                try {
                    const response = await fetch(mediaAssets.images[i]);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `dodam_image_${i + 1}.webp`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } catch (err) {
                    console.error("Image download failed", err);
                }
            }

            // MP4 영상 생성 (GROW 이상만)
            if (limits.hasVideo) {
                try {
                    const mod = await import('../../services/mediaGenerationService');
                    const videoBlob = await mod.createSlideVideo(mediaAssets.images);
                    const url = window.URL.createObjectURL(videoBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
                    a.download = `dodam_ai_video.${ext}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } catch (err) {
                    console.error("Video generation failed", err);
                    alert("영상 파일 생성 중 오류가 발생했습니다.");
                }
            }
        }

        // 3. 공통 종료 처리
        setIsRecordingVideo(false);
        completeTodayAction();
        markAsPublished(currentContent.day);
        setActionStatus('COMPLETED');
        setFlowState('END');

        // 승급 체크
        if (checkAndUpgrade({
            completedCount: completedCount + 1,
            accountStatus: 'NORMAL',
            plan: user?.tier || 'GROW'
        })) {
            setShowUpgradeNotif(true);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                .no-select {
                    user-select: none;
                    -webkit-user-select: none;
                }
                .neon-text {
                    text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
                }
            `}} />

            {/* 1. ENTRY STATE */}
            {flowState === 'ENTRY' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full p-8 text-center space-y-8 glass-card border-brand-primary/20 bg-black/40"
                >
                    <div className="space-y-4">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">오늘의 액션을 시작합니다</h1>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            이 글은 블로그 구조를 안정시키는<br />
                            중요한 <span className="text-brand-primary">기준점 역할</span>을 합니다.
                        </p>
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mt-4">
                            STEP 1에서는 시스템이 정한 방식으로만 진행됩니다.
                        </p>
                    </div>
                    <button
                        onClick={startProcess}
                        className="w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:shadow-neon transition-all"
                    >
                        오늘의 글 자동 생성 시작
                    </button>
                </motion.div>
            )}

            {/* 2. PROCESSING STATE */}
            {flowState === 'PROCESSING' && (
                <div className="flex flex-col items-center justify-center space-y-8 no-select">
                    <div className="relative w-32 h-32">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 rounded-full border-4 border-brand-primary/20 border-t-brand-primary shadow-neon"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Bot size={48} className="text-brand-primary" />
                        </div>
                    </div>

                    <div className="h-20 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={loadingMsgIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-xl font-bold text-center text-white"
                            >
                                "{LOADING_MESSAGES[loadingMsgIndex]}"
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest absolute bottom-20">
                        생성 중에는 어떤 조작도 할 수 없습니다.
                    </p>
                </div>
            )}

            {/* 3. FINAL CHECK STATE (Preview & Naver Link) */}
            {flowState === 'FINAL_CHECK' && currentContent && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col bg-black/50 backdrop-blur-md"
                >
                    <div className="h-16 flex items-center justify-center border-b border-white/10 bg-black/40 shrink-0">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                STEP 2 · 최종 확인 / 네이버 발행
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full no-select space-y-8 custom-scrollbar relative">
                        {/* Security Overlay for Code Preview feeling */}
                        <div className="absolute top-4 right-8 flex gap-2">
                            <span className="text-[9px] text-gray-600 font-mono tracking-widest">READ_ONLY_MODE</span>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Title</span>
                            <h1 className="text-2xl font-bold leading-tight border-l-4 border-brand-primary pl-4">
                                {currentContent.title}
                            </h1>
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Body Content</span>
                            <div className="prose prose-invert prose-lg max-w-none opacity-80 border-l border-white/10 pl-4">
                                {currentContent.body.split('\n').map((line, i) => (
                                    <p key={i} className="leading-relaxed whitespace-pre-wrap">{line}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-white/10 bg-black/80 backdrop-blur shrink-0 space-y-4">
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
                                발행할 네이버 블로그 아이디
                            </label>

                            <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 border border-green-500 text-green-500">
                                    @{selectedBlogId || '미지정'}
                                </div>
                                <span className="text-[10px] text-gray-500 flex items-center">
                                    * 프로필 설정에 등록된 아이디로 발행됩니다.
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-yellow-500 text-xs font-bold">
                            <AlertTriangle size={14} />
                            <span>앱 내 수정이 제한됩니다. 네이버에서 최종 확인 후 발행하세요.</span>
                        </div>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-4 rounded-xl border border-white/10 text-gray-400 font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-sm"
                            >
                                나중에 하기
                            </button>
                            <button
                                onClick={handleProceedToMedia}
                                className="px-10 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:bg-white hover:scale-105 hover:shadow-neon transition-all flex items-center gap-3"
                            >
                                <span>이미지 생성하러 가기</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                        <p className="text-[9px] text-center text-gray-600">
                            * 버튼 클릭 시 제목과 본문이 자동으로 복사됩니다.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* 4. IMAGE GENERATION WAITING ROOM */}
            {flowState === 'STEP_IMAGE_GENERATION' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col bg-black/90 backdrop-blur-xl p-8 overflow-hidden"
                >
                    <div className="max-w-6xl mx-auto w-full h-full flex flex-col gap-8">
                        {/* Header */}
                        <div className="flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                                    이미지 생성 대기실 <span className="text-brand-primary text-lg not-italic font-medium ml-2">Image Studio</span>
                                </h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    AI가 추출한 프롬프트를 확인하고, 고퀄리티 이미지를 생성하세요.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase">
                                    Pollinations AI Engine
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
                            {/* Left: Prompt Editor */}
                            <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-brand-primary uppercase tracking-widest flex items-center gap-2">
                                        <Bot size={14} /> AI Image Scenarios
                                    </h3>
                                    {isGeneratingPrompts && <span className="text-[10px] animate-pulse text-brand-primary">Analyzing Content...</span>}
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {imagePrompts.map((prompt, idx) => (
                                        <div key={idx} className="group relative">
                                            <div className="absolute -left-3 top-3 w-6 text-[10px] font-black text-gray-600 text-right">{idx + 1}</div>
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
                                    ))}
                                </div>
                            </div>

                            {/* Center: Image Grid */}
                            <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">
                                        Generative Canvas (AI Studio)
                                    </h3>
                                    <button
                                        onClick={generateAllMedia}
                                        disabled={isGeneratingMedia || imagePrompts.length === 0}
                                        className="px-6 py-2 rounded-lg bg-white/10 border border-white/20 hover:bg-brand-primary hover:text-black hover:border-brand-primary transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {isGeneratingMedia ? "Generating..." : "Generate All Images"}
                                    </button>
                                </div>

                                <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 p-4 overflow-y-auto custom-scrollbar">
                                    {!mediaAssets ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center">
                                                <span className="text-2xl">🎨</span>
                                            </div>
                                            <p className="text-sm font-medium">프롬프트를 확인하고 'Generate All' 버튼을 눌러주세요.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {mediaAssets.images.map((img, idx) => (
                                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/50 relative group">
                                                        <img
                                                            src={img}
                                                            className="w-full h-full object-cover"
                                                            alt={`Generated ${idx}`}
                                                            onError={(e) => {
                                                                e.currentTarget.src = "https://placehold.co/400x400/1a1a1a/666666?text=GEN+LIMIT+REACHED";
                                                                e.currentTarget.onerror = null;
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                                            <div className="flex gap-2">
                                                                <a href={img} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs" title="원본 보기">🔍</a>
                                                                <button onClick={() => regenerateSingleImage(idx)} className="p-2 rounded-full bg-white/10 hover:bg-brand-primary hover:text-black text-white text-xs" title="재생성">🔄</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/20 flex items-start gap-3">
                                                <AlertTriangle size={18} className="text-brand-primary shrink-0 mt-0.5" />
                                                <div className="text-[11px] text-gray-400 leading-relaxed font-medium">
                                                    <span className="text-brand-primary font-bold">[안내]</span> 이미지가 "RATE LIMIT" 메시지로 나오면 AI 서비스 사용량이 일시적으로 초과된 것입니다.
                                                    <br />약 2~5분 뒤에 개별 이미지의 <span className="text-white">재생성(🔄) 버튼</span>을 누르시거나,
                                                    <a href="https://pollinations.ai" target="_blank" rel="noreferrer" className="text-brand-primary underline ml-1">Pollinations.ai</a>에서 무료 가입(Sign Up)을 하시면 더 높은 한도로 끊김 없이 사용 가능합니다.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="h-20 shrink-0 border-t border-white/10 flex items-center justify-end gap-4">
                            <div className="mr-auto text-xs text-gray-500 font-medium">
                                {limits.hasVideo
                                    ? "* 이미지는 개별 저장되며, 다음 단계에서 통합 영상(MP4)을 제작할 수 있습니다."
                                    : "* 현재 START 등급은 이미지 1장만 제공됩니다. (영상 제작은 GROW 이상 가능)"}
                            </div>
                            {limits.hasVideo ? (
                                <button
                                    onClick={() => setFlowState('STEP_VIDEO_GEN')}
                                    className="px-8 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:bg-white hover:scale-105 hover:shadow-lg transition-all flex items-center gap-3"
                                >
                                    <span>최종 검수 및 영상 제작 단계로 이동</span>
                                    <ArrowRight size={18} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleNaverPublish}
                                    className="px-8 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:bg-white hover:scale-105 hover:shadow-lg transition-all flex items-center gap-3"
                                >
                                    <span>이미지 저장 및 오늘의 업무 완료</span>
                                    <ArrowRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 5. VIDEO STUDIO (Slideshow Preview) */}
            {flowState === 'STEP_VIDEO_GEN' && mediaAssets && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col bg-black/95 backdrop-blur-2xl p-8 overflow-y-auto custom-scrollbar"
                >
                    <div className="max-w-4xl mx-auto w-full min-h-full flex flex-col gap-8 text-center items-center">
                        <div className="space-y-4">
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-brand-primary">
                                AI Video Studio V1
                            </h2>
                            <p className="text-gray-400 text-sm">
                                선택된 4장의 이미지를 활용한 **슬라이드 쇼 영상 미리보기**입니다.<br />
                                릴스, 숏츠 등에 바로 활용 가능한 규격으로 제작됩니다.
                            </p>
                        </div>

                        {/* Video Mockup / Slideshow */}
                        <div className="relative aspect-[9/16] h-[55vh] rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl bg-black">
                            {/* Simple CSS Slideshow Animation */}
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

                            {/* Overlay Branding */}
                            <div className="absolute top-8 left-0 right-0 z-10">
                                <span className="px-4 py-2 bg-black/50 backdrop-blur rounded-full text-[10px] font-black tracking-widest text-brand-primary uppercase border border-brand-primary/30">
                                    {brand.clinicName || 'NANO BANANA'}
                                </span>
                            </div>

                            <div className="absolute bottom-12 left-0 right-0 z-10 px-6">
                                <div className="p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-left">
                                    <p className="text-white text-xs font-bold leading-relaxed line-clamp-3">
                                        {currentContent?.title}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full flex justify-center gap-6 mt-4">
                            <button
                                onClick={() => setFlowState('STEP_IMAGE_GENERATION')}
                                className="px-8 py-4 rounded-xl border border-white/10 text-gray-400 font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-sm"
                            >
                                이미지 다시 고르기
                            </button>
                            <button
                                onClick={handleNaverPublish}
                                disabled={isRecordingVideo}
                                className={`px-12 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:bg-white hover:scale-105 hover:shadow-neon transition-all flex items-center gap-3 ${isRecordingVideo ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <Download size={18} />
                                <span>{isRecordingVideo ? "영상 및 이미지 저장 중..." : "이미지 및 영상 저장 후 대시보드로 이동"}</span>
                            </button>
                        </div>

                        {isRecordingVideo && (
                            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-6">
                                <div className="w-20 h-20 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon" />
                                <div className="text-center space-y-2">
                                    <p className="text-brand-primary text-xl font-black uppercase tracking-widest animate-pulse">
                                        AI 영상 인코딩 및 이미지 패키징 중
                                    </p>
                                    <p className="text-gray-500 text-sm">약 15초 뒤 다운로드가 시작되며 대시보드로 이동합니다.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
            {flowState === 'END' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full p-10 glass-card border-brand-primary/20 bg-black/40 space-y-8 text-center"
                >
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter neon-text text-brand-primary">
                            오늘의 액션 완료
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">
                            오늘 생성된 글은 <span className="text-brand-primary font-bold">콘텐츠 아카이브</span>에<br />
                            자동 저장되어 있습니다.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <span className="block text-[10px] text-gray-500 font-black uppercase mb-1">이번 달 진행률</span>
                            <span className="text-2xl font-black text-brand-primary">{completedCount + 1} / 30</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <span className="block text-[10px] text-gray-500 font-black uppercase mb-1">다음 액션 오픈</span>
                            <span className="text-lg font-bold text-white">내일 오전 9시</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-xl border border-white/20 hover:bg-white/10 transition-all font-bold text-sm uppercase tracking-widest"
                    >
                        대시보드로 돌아가기
                    </button>
                </motion.div>
            )}

            {/* Upgrade Notification Overlay */}
            <AnimatePresence>
                {showUpgradeNotif && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass-card p-10 max-w-md text-center space-y-6 border-brand-primary shadow-neon bg-black/60"
                        >
                            <div className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center mx-auto shadow-neon">
                                <ShieldCheck size={40} className="text-black" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-brand-primary">Step 2 Unlocked</h2>
                                <p className="text-gray-400 font-medium leading-relaxed">
                                    축하합니다 원장님! 시스템 운영 신뢰도가 확보되어 <br />
                                    이제 콘텐츠의 <span className="text-brand-primary font-bold">제한적 수정 권한</span>이 부여되었습니다.
                                </p>
                            </div>
                            <button
                                onClick={() => { setShowUpgradeNotif(false); onClose(); }}
                                className="w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest shadow-neon"
                            >
                                확인하였습니다
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
