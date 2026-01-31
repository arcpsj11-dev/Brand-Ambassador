import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContentStore } from '../../store/useContentStore';
import {
    Calendar,
    Tag,
    ShieldCheck,
    ExternalLink,
    Lock,
    Pencil,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { useStepStore } from '../../store/useStepStore';
import { RestrictedEditor } from './RestrictedEditor';
import { FullEditor } from './FullEditor';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * 콘텐츠 아카이브 컴포넌트
 * 시스템에 의해 생성된 모든 콘텐츠의 기록 보관소
 */
export const ContentArchive: React.FC = () => {
    const { contents, completedCount, setRegenerationTopic } = useContentStore();
    const { currentStep, canAccess } = useStepStore();
    const { user } = useAuthStore();
    const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);

    const isAdmin = user?.role === 'admin';
    const plan = user?.tier || 'BASIC';

    // 1️⃣ 화면 진입 조건 (Gate) - STEP 2 이상 + 3건 이상 발행
    const isGateOpen = isAdmin || (
        currentStep >= 2 &&
        completedCount >= 3 &&
        contents.length > 0 &&
        contents.every(c => c.status === 'SCHEDULED' || c.status === 'PUBLISHED')
    );

    // 2️⃣ 구체적 권한 판정
    const titleFullAuth = canAccess('editTitleFull', plan);
    const titlePartialAuth = canAccess('editTitlePartial', plan);

    const handleItemClick = (id: string) => {
        if (!isGateOpen) {
            alert('🔒 단계 해금 조건이 아직 충족되지 않았거나, 현재 블로그 상태 점검이 필요합니다.\n\n조건: STEP 2 도달 + 3회 이상 완료 + 모든 글 예약/발행 상태');
            return;
        }
        setSelectedEditorId(id);
    };

    /* 삭제 기능 제거
    const handleDelete = (e: React.MouseEvent, id: string) => { ... }
    const handleClearAll = () => { ... }
    */

    const handleRegenerate = (e: React.MouseEvent, title: string) => {
        e.stopPropagation();
        if (window.confirm(`'${title}' 주제로 새로운 글을 다시 생성하시겠습니까?`)) {
            setRegenerationTopic(title);
            // 대시보드 탭으로 강제 이동 로직이 필요할 수 있으나, 
            // 여기서는 일단 상태만 설정하고 유저에게 알림
            alert('재생성 요청이 접수되었습니다. 대시보드에서 [재실행] 버튼을 눌러주세요.');
        }
    };

    const sortedContents = [...contents].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
            case 'PUBLISHED': return 'bg-green-500/20 text-green-400 border-green-500/20';
            case 'LOCKED': return 'bg-gray-500/20 text-gray-400 border-gray-500/20';
            default: return 'bg-white/5 text-gray-500 border-white/5';
        }
    };

    return (
        <div className="space-y-8 select-none">
            <AnimatePresence>
                {selectedEditorId && (
                    titleFullAuth.granted || isAdmin ? (
                        <FullEditor
                            contentId={selectedEditorId}
                            onClose={() => setSelectedEditorId(null)}
                        />
                    ) : (
                        <RestrictedEditor
                            contentId={selectedEditorId}
                            onClose={() => setSelectedEditorId(null)}
                        />
                    )
                )}
            </AnimatePresence>

            <header className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                            {isGateOpen ? <ShieldCheck className="text-brand-primary" size={24} /> : <Lock className="text-gray-400" size={24} />}
                        </div>
                        <div>
                            <h1 className="text-5xl font-black neon-text uppercase italic tracking-tighter leading-none">
                                콘텐츠 아카이브
                            </h1>
                            <p className="text-brand-primary/60 font-bold text-xs uppercase tracking-[0.3em] mt-2">
                                {plan} PLAN · STEP {currentStep} {isGateOpen && ' · GATE UNLOCKED'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">

                        {/* Delete All 버튼 제거 */}
                    </div>
                </div>
            </header>

            <div className="grid gap-4">
                {sortedContents.length === 0 ? (
                    <div className="glass-card p-20 text-center space-y-4 border-dashed border-white/10">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Lock className="text-gray-700" size={32} />
                        </div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">기록된 데이터가 없습니다</p>
                    </div>
                ) : (
                    sortedContents.map((content, index) => (
                        <motion.div
                            key={content.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleItemClick(content.id)}
                            className={`glass-card p-6 flex flex-col md:flex-row items-center gap-6 group transition-all border-white/5 ${isGateOpen ? 'cursor-pointer hover:border-brand-primary/40 hover:bg-brand-primary/[0.02]' : ''
                                }`}
                        >
                            <div className="w-full md:w-48 flex flex-col gap-1 text-left">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Calendar size={14} />
                                    <span className="text-xs font-black tracking-tighter">{new Date(content.createdAt).toLocaleDateString('ko-KR')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-brand-primary" />
                                    <span className="text-lg font-black italic uppercase tracking-tighter">
                                        STEP {currentStep}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-2 text-left w-full">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-widest ${getStatusStyle(content.status)}`}>
                                        {content.status}
                                    </span>

                                    {titleFullAuth.granted ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/10 border border-purple-500/20 text-purple-400 uppercase tracking-widest">
                                            전체 편집 (ULTRA)
                                        </span>
                                    ) : titlePartialAuth.granted ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-brand-primary/10 border border-brand-primary/20 text-brand-primary uppercase tracking-widest">
                                            부분 편집 (PRO)
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-gray-500/10 border border-white/10 text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                            <Lock size={8} /> 수정 불가 (BASIC)
                                        </span>
                                    )}

                                    <h3 className="text-lg font-bold text-white/90 truncate max-w-md">
                                        {content.title}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em]">
                                    <span className="flex items-center gap-1">
                                        <ExternalLink size={12} /> Naver Blog
                                    </span>
                                    <span className="flex items-center gap-1 text-blue-500/60">
                                        <ShieldCheck size={12} /> Auto-Protected
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => handleRegenerate(e, content.title)}
                                    className="w-10 h-10 rounded-full border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                                    title="다시 생성"
                                >
                                    <RefreshCw size={18} />
                                </button>

                                {(titleFullAuth.granted || titlePartialAuth.granted || isAdmin) ? (
                                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-brand-primary">
                                        <Pencil size={18} />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-600">
                                        <Lock size={18} />
                                    </div>
                                )}

                                {/* 개별 삭제 버튼 제거 */}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className={`p-6 rounded-2xl border flex items-center gap-4 ${isAdmin ? 'bg-purple-500/[0.03] border-purple-500/20' : 'bg-brand-primary/[0.03] border-brand-primary/10'}`}>
                {isGateOpen ? <ShieldCheck className="text-brand-primary" size={24} /> : <AlertTriangle className="text-gray-500" size={24} />}
                <div className="text-xs text-gray-500 leading-relaxed font-medium">
                    <strong className={`${isGateOpen ? 'text-brand-primary' : 'text-gray-400'} block mb-0.5 uppercase tracking-widest`}>
                        {isGateOpen ? 'Unlock Status: Active' : 'Stability Protocol'}
                    </strong>
                    {isAdmin
                        ? '원장님(관리자)은 모든 콘텐츠를 자유롭게 관리할 수 있습니다.'
                        : isGateOpen
                            ? (titleFullAuth.granted
                                ? '축하합니다! ULTRA 플랜과 자격 달성으로 전체 편집(Operator Mode) 권한이 활성화되었습니다.'
                                : (plan === 'PRO'
                                    ? 'PRO 플랜 사용자로서 부분 편집 권한이 해금되었습니다. 전체 구조를 바꾸려면 ULTRA 플랜이 필요합니다.'
                                    : '단계가 해금되었으나 현재 BASIC 플랜입니다. 편집 기능을 사용하려면 PRO 이상의 요금제가 필요합니다.'))
                            : '현재 블로그 지수 보호를 위해 수정이 제한되어 있습니다. 3회 이상 발행 성공 시 STEP 2 권한이 자동으로 해금됩니다.'}
                </div>
            </div>
        </div>
    );
};
