import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, PlayCircle, Image as ImageIcon, Copy, MessageSquarePlus } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const WelcomeModal: React.FC = () => {
    const { user, setHasSeenManual } = useAuthStore();
    const [dontShowAgain, setDontShowAgain] = useState(false);

    if (!user || user.hasSeenManual) return null;

    // To allow closing for the current session even if "don't show again" is not checked,
    // we use a local state to hide it.
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    const onClose = () => {
        if (dontShowAgain) {
            setHasSeenManual(true);
        }
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-gray-900/90 border border-white/10 rounded-3xl shadow-2xl overflow-hidden glass-card flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-brand-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
                                <MessageSquarePlus className="text-black" size={20} />
                            </div>
                            <div>
                                <h2 className="font-black text-xl tracking-tight">제니 AI에 오신 것을 환영합니다!</h2>
                                <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest">Brand Ambassador Onboarding</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-brand-primary">
                                <PlayCircle size={18} />
                                <h3 className="font-bold">매일의 5분 마케팅 흐름</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Step 01</span>
                                    <h4 className="font-bold text-sm">30일 마케팅 주제 생성</h4>
                                    <p className="text-xs text-gray-400">지역 키워드를 넣고 한 달 치 주제를 즉시 받으세요.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase">Step 02</span>
                                    <h4 className="font-bold text-sm">프리미엄 본문 & 이미지</h4>
                                    <p className="text-xs text-gray-400">전문적인 의료 정보글과 상위 노출용 AI 이미지를 생성합니다.</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-brand-primary">
                                <Copy size={18} />
                                <h3 className="font-bold">네이버 블로그 포스팅 팁</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10">
                                    <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="text-brand-primary" size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm mb-1">본문은 Ctrl + V 로 바로 붙여넣으세요</h4>
                                        <p className="text-xs text-gray-400">마크다운 기호 없이 깔끔한 텍스트로 복사됩니다.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10">
                                    <div className="w-8 h-8 rounded-lg bg-brand-primary/20 flex items-center justify-center shrink-0">
                                        <ImageIcon className="text-brand-primary" size={16} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm mb-1">이미지와 동영상을 꼭 활용하세요</h4>
                                        <p className="text-xs text-gray-400">MP4 영상 파일은 상위 노출을 위한 강력한 무기입니다.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="p-6 rounded-2xl bg-gray-800/50 border border-white/5 flex items-center gap-4 italic underline decoration-brand-primary decoration-2 underline-offset-4">
                            <p className="text-sm text-center w-full">"전문적인 의료 지식과 AI 기술의 결합, Brand Ambassador가 원장님을 지원합니다."</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 flex items-center justify-between bg-black/40">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={dontShowAgain}
                                    onChange={(e) => setDontShowAgain(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="w-5 h-5 border-2 border-white/20 rounded-md peer-checked:bg-brand-primary peer-checked:border-brand-primary transition-all" />
                                <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black opacity-0 peer-checked:opacity-100 transition-all" size={12} />
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">다시 보지 않기</span>
                        </label>

                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-brand-primary text-black font-black rounded-xl shadow-neon hover:scale-105 transition-all text-sm uppercase tracking-tight"
                        >
                            시작하기
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
