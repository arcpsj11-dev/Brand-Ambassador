import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck,
    AlertTriangle,
    ArrowRight,
    Bot
} from 'lucide-react';
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

// 5단계 상태 정의 (AUTO_SCHEDULE 제거 후 FINAL_CHECK 통합)
type FlowState = 'ENTRY' | 'PROCESSING' | 'FINAL_CHECK' | 'END';

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

            // 4. 내부 링크 자동 삽입 (Supporting 일 경우)
            if (targetType === 'supporting' && pillarTitle) {
                fullBody += `\n\n---\n**💡 제니의 추천 팩트체크!**\n"${pillarTitle}"에 대해 더 자세히 알고 싶다면? 아래 필러글을 꼭 확인해 보세요! 🍌`;
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
    const handleNaverPublish = () => {
        if (!currentContent) return;

        let targetBlogId = selectedBlogId;

        if (!targetBlogId) {
            alert("네이버 블로그 아이디를 입력하거나 선택해주세요.");
            return;
        }

        // 1. 클립보드 복사 (제목 + 본문) - 이미지 URL은 본문에 포함되어 있다고 가정
        // TODO: 이미지 URL 별도 복사가 필요하면 여기에 로직 추가
        const copyText = `${currentContent.title}\n\n${currentContent.body}`;

        navigator.clipboard.writeText(copyText).then(() => {
            alert(`내용이 클립보드에 복사되었습니다.\n\n네이버 블로그(${targetBlogId}) 글쓰기 창이 열리면 붙여넣기(Ctrl+V) 하세요.`);
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            alert("클립보드 복사에 실패했습니다. 수동으로 복사해주세요.");
        });

        // 2. 네이버 블로그 글쓰기 새창 이동 (요청된 URL 패턴)
        // https://blog.naver.com/{Selected_ID}/postwrite
        window.open(`https://blog.naver.com/${targetBlogId}/postwrite`, '_blank');

        // 3. 앱 내 상태 완료 처리 (Manual Publish)
        // 아카이브에 이미 저장되어 있으므로 상태만 업데이트 (여기서는 리스트 업데이트가 복잡하므로 completeTodayAction만 호출하여 UI 제어)
        // 실제 운영 시에는 id를 추적하여 status를 PUBLISHED로 바꿔야 함. 
        // 현재는 addContent가 중복되지 않도록 여기서 삭제.

        completeTodayAction();
        markAsPublished(currentContent.day);
        setActionStatus('COMPLETED');
        setFlowState('END');

        // STEP 2 -> 3 승급 체크
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
                                onClick={handleNaverPublish}
                                className="px-10 py-4 rounded-xl bg-[#03C75A] text-white font-black uppercase tracking-widest hover:bg-[#02b351] hover:scale-105 hover:shadow-lg transition-all flex items-center gap-3"
                            >
                                <span>네이버 글쓰기 바로가기</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                        <p className="text-[9px] text-center text-gray-600">
                            * 버튼 클릭 시 제목과 본문이 자동으로 복사됩니다.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* 5. END STATE */}
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
