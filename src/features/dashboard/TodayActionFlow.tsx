import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bot, AlertTriangle, ArrowRight, CheckCircle2, Image as ImageIcon, Video, Download } from 'lucide-react';
import { handleManualCopy } from '../../utils/clipboardUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useContentStore } from '../../store/useContentStore';
import { useBrandStore } from '../../store/useBrandStore';
import { useStepStore } from '../../store/useStepStore';
import { usePlannerStore } from '../../store/usePlannerStore';
import { geminiReasoningService } from '../../services/geminiService';
import { OccupationSelector } from '../admin/OccupationSelector';

import { useAuthStore } from '../../store/useAuthStore';
import { useProfileStore } from '../../store/useProfileStore';
import { useTopicStore } from '../../store/useTopicStore';
import { imageService } from '../../services/imageService';
import { videoService } from '../../services/videoService';
import { getNextUnwrittenTopic, markTopicAsCompleted } from '../../services/topicClusterService'; // [NEW]
import { buildContentPrompt } from '../../services/promptBuilder'; // [NEW]

import { useSlotStore } from '../../store/useSlotStore'; // [NEW]

interface TodayActionFlowProps {
    onClose: () => void;
}

type FlowState = 'ENTRY' | 'PROCESSING' | 'FINAL_CHECK' | 'END';

const LOADING_MESSAGES = [
    "원장님, 오늘 글은 구조 안정에 중요한 포인트예요.",
    "지금은 수정하지 않는 게, 나중에 훨씬 빨라집니다.",
    "의료 표현은 시스템이 먼저 점검하고 있어요.",
    "이 단계는 블로그 지수를 쌓는 과정입니다."
];

export const TodayActionFlow: React.FC<TodayActionFlowProps> = ({ onClose }) => {
    const { setActionStatus, addContent, updateStatus, completeTodayAction, completedCount, regenerationTopic, setRegenerationTopic } = useContentStore();
    const { checkAndUpgrade } = useStepStore();
    const { user } = useAuthStore();
    const { keyKeywords } = useProfileStore();
    const { setClusters, getNextTopic, markAsPublished, getSlotData } = useTopicStore(); // [Modified] Removed clusters from destructure, use getSlotData
    const { activeSlotId } = useSlotStore(); // [NEW] Use active slot
    const { updateDayStatus } = usePlannerStore();
    const brand = useBrandStore();

    // Derived clusters
    const slotTopicData = getSlotData(activeSlotId || '');
    const clusters = slotTopicData?.clusters || [];

    const [flowState, setFlowState] = useState<FlowState>('ENTRY');
    const [currentContent, setCurrentContent] = useState<{
        title: string;
        body: string;
        type: string;
        pillarTitle?: string;
        day: number;
        imagePrompts?: Array<{ prompt: string; alt: string; recommendedPhotoKey?: string }>
    } | null>(null);
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [showUpgradeNotif, setShowUpgradeNotif] = useState(false);
    const [currentContentId, setCurrentContentId] = useState<string | null>(null);

    // Image Generation State
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState<number | null>(null); // index of image being processed
    const [isGeneratingSlideshow, setIsGeneratingSlideshow] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<Record<number, string>>({}); // index -> url

    const handleGenerateSingleImage = async (index: number, prompt: string) => {
        setIsGeneratingImage(true);
        try {
            const url = await imageService.generateImage(prompt);
            setGeneratedImages(prev => ({ ...prev, [index]: url }));
        } catch (error) {
            alert(`이미지 생성 실패: ${error}`);
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleGenerateVideo = async (index: number, imageUrl: string) => {
        setIsGeneratingVideo(index);
        try {
            const { blob, extension } = await videoService.generateVideoFromImage(imageUrl);
            videoService.downloadBlob(blob, `blog_video_${index + 1}.${extension}`);
        } catch (error) {
            console.error('Video generation failed:', error);
            alert('동영상 생성에 실패했습니다. (콘솔 확인 필요)');
        } finally {
            setIsGeneratingVideo(null);
        }
    };

    const handleGenerateSlideshowVideo = async () => {
        const imageUrls = Object.values(generatedImages);
        if (imageUrls.length < 2) {
            alert('동영상을 만들려면 최소 2개 이상의 이미지가 필요합니다.');
            return;
        }

        setIsGeneratingSlideshow(true);
        try {
            const { blob, extension } = await videoService.generateSlideshowVideo(imageUrls, 4000); // 4sec per image
            videoService.downloadBlob(blob, `blog_slideshow_full.${extension}`);
        } catch (error) {
            console.error('Slideshow generation failed:', error);
            alert('동영상 생성에 실패했습니다. (콘솔 확인 필요)');
        } finally {
            setIsGeneratingSlideshow(false);
        }
    };

    // Bulk image generation
    const handleGenerateAllImages = async () => {
        if (!currentContent?.imagePrompts) return;

        setIsGeneratingImage(true);

        for (let i = 0; i < currentContent.imagePrompts.length; i++) {
            const img = currentContent.imagePrompts[i];
            try {
                console.log(`[Bulk] Generating image ${i + 1}/${currentContent.imagePrompts.length}...`);
                const url = await imageService.generateImage(img.prompt);
                setGeneratedImages(prev => ({ ...prev, [i]: url }));
            } catch (error) {
                console.error(`Image ${i + 1} generation failed:`, error);
                // Continue even if one fails
            }
        }

        setIsGeneratingImage(false);
    };

    const handleDownloadAll = async () => {
        const imageEntries = Object.entries(generatedImages);
        if (imageEntries.length === 0) return;

        for (const [index, url] of imageEntries) {
            try {
                // Convert and download as WebP
                await videoService.downloadImageAsWebP(url, `blog_image_${Number(index) + 1}.webp`);

                // Add a small delay between downloads to prevent browser blocking
                await new Promise(r => setTimeout(r, 500));
            } catch (error) {
                console.error(`Failed to download image ${index}:`, error);
            }
        }
    };

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
        if (!activeSlotId) {
            alert("활성화된 슬롯이 없습니다.");
            return;
        }

        setFlowState('PROCESSING');
        setActionStatus('STEP_GENERATING');

        try {
            let targetTopic = '';
            let targetType: 'pillar' | 'supporting' = 'supporting';
            let pillarTitle = '';
            let currentDay = 1;
            let currentTopicId: number | null = null;
            let nextTopicTitle: string | undefined;
            let fullTopicData: any = null; // [FIX] Store for prompt building

            if (regenerationTopic) {
                // Regeneration mode - use old logic
                targetTopic = regenerationTopic;
                setRegenerationTopic(null);
            } else {
                // [NEW] DB-driven workflow with Sync
                // 1. Get the current active topic's day number from store
                const nextData = getNextTopic(activeSlotId);
                const preferredDay = nextData?.topic.day;

                // 2. Try to get unwritten topic from DB, favoring the one selected in UI
                const topicData = await getNextUnwrittenTopic(activeSlotId, preferredDay);
                fullTopicData = topicData;

                if (!topicData || !topicData.current) {
                    // No topics in DB yet - generate clusters first
                    if (clusters.length === 0) {
                        const mainTopic = keyKeywords[0] || '교통사고 후유증';
                        const clusteredData = await geminiReasoningService.generateMonthlyTitles(
                            mainTopic
                        );
                        if (clusteredData && clusteredData.clusters) {
                            setClusters(activeSlotId, clusteredData.clusters);
                        }
                    }

                    // Fallback to Zustand-based logic
                    const nextData = getNextTopic(activeSlotId);
                    if (!nextData) {
                        setClusters(activeSlotId, []);
                        throw new Error("분석된 주제가 없습니다. (데이터 형식 오류)");
                    }

                    targetTopic = nextData.topic.title;
                    targetType = nextData.topic.type;
                    pillarTitle = nextData.pillarTitle || '';
                    currentDay = nextData.topic.day;
                } else {
                    // [NEW] Use DB data
                    const { current, next, pillarTitle: dbPillar } = topicData;
                    currentTopicId = current.id ?? null;
                    targetTopic = current.title;
                    targetType = current.content_type;
                    pillarTitle = dbPillar || '';
                    currentDay = current.day_number;
                    nextTopicTitle = next?.title;
                }
            }

            // 3. [NEW] Build dynamic prompt with next topic preview
            let extraPrompt = '';
            if (currentTopicId && nextTopicTitle !== undefined) {
                // We have DB data - use dynamic prompt
                if (fullTopicData && fullTopicData.current) {
                    extraPrompt = buildContentPrompt({
                        currentTopic: fullTopicData.current,
                        nextTopic: fullTopicData.next,
                        pillarTitle,
                        clinicInfo: {
                            name: brand.clinicName || '도담한의원',
                            address: brand.address || '김포시 운양동',
                            phone: brand.phoneNumber || '031-988-1575'
                        }
                    });
                }
            }

            // 4. 본문 생성
            const contentGen = geminiReasoningService.generateStream(targetTopic, {
                clinicName: brand.clinicName || '도담한의원',
                address: brand.address || '김포시 운양동',
                phoneNumber: brand.phoneNumber || '031-988-1575',
                pillarTitle,
                profile: useProfileStore.getState(),
                extraPrompt: extraPrompt || undefined // [NEW] Pass dynamic prompt
            });

            let fullBody = "";
            for await (const chunk of contentGen) {
                fullBody += chunk;
            }

            // 5. 이미지 프롬프트 생성
            const profilePhotos = Object.keys(useProfileStore.getState().clinicPhotos || {});
            const imagePrompts = await geminiReasoningService.generateImagePrompts(fullBody, profilePhotos);

            const newContentData = {
                title: targetTopic,
                body: fullBody,
                type: targetType,
                pillarTitle,
                day: currentDay,
                imagePrompts
            };

            setCurrentContent(newContentData);

            // 6. [자동 저장] 생성 즉시 아카이브에 DRAFT 상태로 저장
            const id = await addContent({
                slotId: activeSlotId,
                title: newContentData.title,
                body: newContentData.body,
                status: 'DRAFT',
                riskCheckPassed: true,
                imagePrompts: imagePrompts,
                logs: []
            });
            setCurrentContentId(id);

            // 7. [NEW] If from DB, mark as completed in content_clusters table
            if (currentTopicId) {
                await markTopicAsCompleted(currentTopicId, fullBody);
            }

            setFlowState('FINAL_CHECK');

        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === "API_KEY_MISSING") {
                alert("관리자 설정에서 Gemini API Key를 먼저 설정해주세요.");
            } else if (errorMessage === "USAGE_LIMIT_REACHED") {
                alert("원장님, 이번 달(또는 현재 등급)의 AI 생성 사용 한도에 도달했습니다.\\n\\n한도 증액이나 등급 상향은 관리자에게 문의해 주세요! 🍌🚀");
            } else {
                alert(`오류가 발생했습니다: ${errorMessage}\\n\\n잠시 후 다시 시도해주세요.`);
            }
            onClose();
        }
    };

    // 네이버 글쓰기 바로가기 (발행 프로세스)
    const handleNaverPublish = async () => {
        if (!currentContent) return;
        if (!activeSlotId) return;

        // [수정] 네이버 아이디 체크 로직 제거 (사용자 요청)
        // const targetBlogId = selectedBlogId;
        // if (!targetBlogId) { ... }

        // 1. 클립보드 복사
        const copyText = `${currentContent.title}\n\n${currentContent.body}`;
        try {
            await navigator.clipboard.writeText(copyText);
            alert(`전체 내용이 클립보드에 복사되었습니다. 블로그에 붙여넣기 하세요.`);
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
        }

        // 2. 공통 종료 처리
        if (currentContentId) {
            updateStatus(currentContentId, 'PUBLISHED');
        }
        completeTodayAction();
        markAsPublished(activeSlotId, currentContent.day); // [FIX] Added activeSlotId
        updateDayStatus(currentContent.day, 'done'); // [SYNC] 마케팅 캔버스 상태 업데이트
        setActionStatus('COMPLETED');
        setFlowState('END');

        // 승급 체크
        const tierMap: Record<string, string> = {
            'START': 'BASIC',
            'GROW': 'PRO',
            'SCALE': 'ULTRA',
        };
        const userTier = tierMap[user?.tier as string] || 'BASIC';

        if (checkAndUpgrade({
            completedCount: completedCount + 1,
            accountStatus: 'NORMAL',
            plan: userTier as any
        })) {
            setShowUpgradeNotif(true);
        }
    };

    // Manual selection copy handler to force plain text (Fixes black background issue)

    return (
        <div
            onCopy={handleManualCopy}
            className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center h-[100dvh] overflow-hidden"
        >
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
                    className="max-w-md w-full p-8 text-center space-y-8 glass-card border-brand-primary/20 bg-black/40 relative"
                >
                    <div className="absolute top-4 right-4 z-50">
                        <OccupationSelector variant="minimal" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">오늘의 액션을 시작합니다</h1>
                        <p className="text-gray-400 font-medium leading-relaxed">
                            이 글은 블로그 구조를 안정시키는<br />
                            중요한 <span className="text-brand-primary">기준점 역할</span>을 합니다.
                        </p>
                        <p className="text-xs text-gray-600 font-bold uppercase tracking-widest mt-4">
                            시스템이 정한 방식으로 최적화된 글을 생성합니다.
                        </p>
                    </div>
                    <button
                        onClick={startProcess}
                        className="w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:shadow-neon transition-all"
                    >
                        오늘의 글 자동 생성 시작
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:text-gray-400 transition-all"
                    >
                        창 닫기
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

            {/* 3. FINAL CHECK STATE */}
            {/* 3. FINAL CHECK STATE - Full Page Scroll Layout */}
            {flowState === 'FINAL_CHECK' && currentContent && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-[110] w-full h-full bg-black/95 backdrop-blur-md overflow-y-auto overflow-x-hidden custom-scrollbar"
                >
                    <div className="min-h-full flex flex-col max-w-3xl mx-auto relative">
                        {/* Header - Sticky Top */}
                        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-center gap-3 shrink-0">
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                                <ShieldCheck size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    최종 확인 및 복사
                                </span>
                            </div>
                            {currentContent.type && (
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentContent.type === 'supporting'
                                    ? 'bg-white/5 text-gray-400 border border-white/10'
                                    : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                                    }`}>
                                    {currentContent.type === 'supporting' ? '보조글' : '필러글'}
                                </div>
                            )}
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 p-6 md:p-8 space-y-8 pb-32">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Title</span>
                                <h1 className="text-2xl font-bold leading-tight border-l-4 border-brand-primary pl-4 text-white">
                                    {currentContent.title}
                                </h1>
                            </div>

                            <div className="space-y-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Body Content</span>
                                <div className="prose prose-invert prose-lg max-w-none opacity-90 border-l border-white/10 pl-4 select-text">
                                    {currentContent.body.split('\n').map((line, i) => (
                                        <p key={i} className="leading-relaxed whitespace-pre-wrap text-gray-200">{line}</p>
                                    ))}
                                </div>
                            </div>

                            {/* [NEW] Image Prompts Section */}
                            {currentContent.imagePrompts && currentContent.imagePrompts.length > 0 && (
                                <div className="space-y-4 pt-8 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">AI Suggested Images</span>
                                            <div className="h-px flex-1 bg-brand-primary/20"></div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleGenerateAllImages}
                                                disabled={isGeneratingImage}
                                                className="px-4 py-2 rounded-lg bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-black font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-brand-primary/30"
                                            >
                                                {isGeneratingImage ? (
                                                    <>
                                                        <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                                        생성 중...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon size={14} />
                                                        전체 재생성
                                                    </>
                                                )}
                                            </button>

                                            {Object.keys(generatedImages).length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleDownloadAll}
                                                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 border border-white/20 shadow-lg"
                                                    >
                                                        <ArrowRight size={14} className="rotate-90" />
                                                        이미지 일괄 다운로드
                                                    </button>
                                                    {Object.keys(generatedImages).length >= 2 && (
                                                        <button
                                                            onClick={handleGenerateSlideshowVideo}
                                                            disabled={isGeneratingSlideshow}
                                                            className="px-4 py-2 rounded-lg bg-brand-primary/10 hover:bg-brand-primary/30 text-brand-primary font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 border border-brand-primary/30 shadow-neon-sm"
                                                        >
                                                            {isGeneratingSlideshow ? (
                                                                <div className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Video size={14} />
                                                            )}
                                                            전체 동영상 생성 (MP4)
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {currentContent.imagePrompts.map((img, idx) => (
                                            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Image {idx + 1}</span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(img.prompt)}
                                                        className="text-[10px] text-brand-primary hover:text-white transition-colors"
                                                    >
                                                        Copy Prompt
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-300 font-medium select-all">{img.prompt}</p>

                                                {/* Generated Real Image Display */}
                                                {generatedImages[idx] ? (
                                                    <div className="space-y-3">
                                                        <div className="relative rounded-lg overflow-hidden border border-white/20">
                                                            <img src={generatedImages[idx]} alt={img.alt} className="w-full h-auto object-cover" />
                                                            <div className="absolute bottom-0 right-0 bg-black/50 text-[10px] text-white px-2 py-1 backdrop-blur-sm">
                                                                Generated by AI
                                                            </div>
                                                            {isGeneratingVideo === idx && (
                                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                                                                    <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin shadow-neon" />
                                                                    <span className="text-xs font-black uppercase tracking-widest text-brand-primary animate-pulse">Encoding MP4...</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Always Visible Control Buttons */}
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    videoService.downloadImageAsWebP(
                                                                        generatedImages[idx],
                                                                        `blog_image_${idx + 1}.webp`
                                                                    );
                                                                }}
                                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-xs font-bold"
                                                            >
                                                                <Download size={16} />
                                                                이미지 다운로드 (WebP)
                                                            </button>
                                                            <button
                                                                onClick={() => handleGenerateVideo(idx, generatedImages[idx])}
                                                                disabled={isGeneratingVideo !== null}
                                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/30 text-brand-primary transition-all text-xs font-bold disabled:opacity-50"
                                                            >
                                                                {isGeneratingVideo === idx ? (
                                                                    <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <Video size={16} />
                                                                )}
                                                                MP4 동영상 생성
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => handleGenerateSingleImage(idx, img.prompt)}
                                                            disabled={isGeneratingImage}
                                                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-brand-primary hover:text-black text-xs font-bold transition-all border border-white/10 flex items-center gap-2"
                                                        >
                                                            {isGeneratingImage ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ImageIcon size={14} />}
                                                            Generate Real Image
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 text-xs text-gray-500 bg-black/20 p-2 rounded-lg">
                                                    <span className="font-bold">ALT:</span>
                                                    <span>{img.alt}</span>
                                                </div>

                                                {/* [NEW] Recommended Real Photo from Profile */}
                                                {img.recommendedPhotoKey && useProfileStore.getState().clinicPhotos[img.recommendedPhotoKey] && (
                                                    <div className="mt-4 p-4 rounded-xl border border-brand-primary/30 bg-brand-primary/5 space-y-3">
                                                        <div className="flex items-center gap-2 text-brand-primary text-[10px] font-black uppercase tracking-widest">
                                                            <ImageIcon size={14} />
                                                            Recommended Real Photo (추천 원내 사진)
                                                        </div>
                                                        <div className="relative rounded-lg overflow-hidden border border-brand-primary/20 aspect-video bg-black/40">
                                                            <img
                                                                src={useProfileStore.getState().clinicPhotos[img.recommendedPhotoKey]}
                                                                alt="Real clinic photo"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute top-2 right-2 flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        const link = document.createElement('a');
                                                                        link.href = useProfileStore.getState().clinicPhotos[img.recommendedPhotoKey!];
                                                                        link.download = `real_clinic_photo_${img.recommendedPhotoKey}.png`;
                                                                        link.click();
                                                                    }}
                                                                    className="p-2 rounded-lg bg-black/60 hover:bg-black transition-all text-white"
                                                                    title="Download Photo"
                                                                >
                                                                    <ArrowRight size={14} className="rotate-90" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-medium">
                                                            * 이 포스팅에는 원장님이 직접 올리신 '{img.recommendedPhotoKey}' 사진을 사용하는 것을 강력 추천합니다.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Fixed/Sticky Bottom or just placed at end */}
                        <div className="sticky bottom-0 z-10 bg-black/90 backdrop-blur-xl border-t border-white/10 p-6 text-center space-y-4 shadow-2xl">
                            <div className="flex items-center justify-center gap-2 text-yellow-500 text-xs font-bold mb-2">
                                <AlertTriangle size={14} />
                                <span>내용을 복사하여 블로그에 발행을 완료하세요.</span>
                            </div>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={onClose}
                                    className="px-8 py-4 rounded-xl border border-white/10 text-gray-400 font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-sm"
                                >
                                    나중에 하기
                                </button>
                                <button
                                    onClick={handleNaverPublish}
                                    className="px-12 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:bg-white hover:scale-105 hover:shadow-neon transition-all flex items-center gap-3"
                                >
                                    <span>저장 및 복사</span>
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 4. END STATE */}
            {flowState === 'END' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full p-8 text-center space-y-8 glass-card border-brand-primary/20 bg-black/40"
                >
                    <div className="space-y-4">
                        <CheckCircle2 color="#00F3FF" size={48} className="mx-auto" />
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">발행 준비가 끝났습니다!</h1>
                        <p className="text-gray-400 font-medium">
                            네이버 블로그에서 글 작성을 마쳤다면<br />
                            내일 다시 새로운 액션으로 뵙겠습니다.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:shadow-neon transition-all"
                    >
                        대시보드로 돌아가기
                    </button>
                    {showUpgradeNotif && (
                        <div className="p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-bold">
                            🎉 축하합니다! 등급이 업그레이드될 준비가 되었습니다.
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};
