import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bot, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    const { clusters, setClusters, getNextTopic, markAsPublished } = useTopicStore();
    const { updateDayStatus } = usePlannerStore();
    const brand = useBrandStore();

    const [flowState, setFlowState] = useState<FlowState>('ENTRY');
    const [currentContent, setCurrentContent] = useState<{ title: string; body: string; type: string; pillarTitle?: string; day: number } | null>(null);
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    const [showUpgradeNotif, setShowUpgradeNotif] = useState(false);
    const [currentContentId, setCurrentContentId] = useState<string | null>(null);

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
                if (!nextData) {
                    setClusters([]); // [RESET] 잘못된 데이터일 수 있으므로 초기화
                    throw new Error("분석된 주제가 없습니다. (데이터 형식 오류)");
                }

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
            const id = addContent({
                title: newContentData.title,
                body: newContentData.body,
                status: 'DRAFT', // 처음에는 DRAFT로 저장
                riskCheckPassed: true,
                logs: []
            });
            setCurrentContentId(id);

            setFlowState('FINAL_CHECK');

        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === "API_KEY_MISSING") {
                alert("관리자 설정에서 Gemini API Key를 먼저 설정해주세요.");
            } else {
                // [DEBUG] 실제 에러 메시지 노출 (사용자 요청)
                alert(`오류가 발생했습니다: ${errorMessage}\n\n잠시 후 다시 시도해주세요.`);
            }
            onClose();
        }
    };

    // 네이버 글쓰기 바로가기 (발행 프로세스)
    const handleNaverPublish = async () => {
        if (!currentContent) return;
        if (!currentContent) return;

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
        markAsPublished(currentContent.day);
        updateDayStatus(currentContent.day, 'done'); // [SYNC] 마케팅 캔버스 상태 업데이트
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
        <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center h-[100dvh] overflow-hidden">
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
            {flowState === 'FINAL_CHECK' && currentContent && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-[110] w-full h-[100dvh] flex flex-col bg-black/95 backdrop-blur-md overflow-hidden"
                >
                    <div className="h-16 flex items-center justify-center border-b border-white/10 bg-black/40 shrink-0">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                            <ShieldCheck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                최종 확인 및 복사
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 max-w-3xl mx-auto w-full space-y-8 custom-scrollbar relative pb-32">
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

                    <div className="p-6 border-t border-white/10 bg-black/80 backdrop-blur shrink-0 space-y-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-yellow-500 text-xs font-bold mb-4">
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
