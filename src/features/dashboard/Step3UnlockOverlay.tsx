import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Rocket, ChevronRight } from 'lucide-react';
import { useStepStore } from '../../store/useStepStore';

export const Step3UnlockOverlay: React.FC = () => {
    const { currentStep, hasSeenStep3Celebrate, setSeenStep3Celebrate } = useStepStore();

    // STEP 3이고 아직 축하 화면을 보지 않았을 때만 노출
    if (currentStep !== 3 || hasSeenStep3Celebrate) return null;

    const handleStart = () => {
        setSeenStep3Celebrate(true);
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-6 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="max-w-xl w-full text-center space-y-10 z-10"
            >
                <div className="relative inline-block">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-[-20px] rounded-full border border-dashed border-brand-primary/30"
                    />
                    <div className="w-24 h-24 bg-brand-primary rounded-3xl flex items-center justify-center shadow-neon mx-auto transform rotate-12 group">
                        <Rocket size={48} className="text-black group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                </div>

                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-primary mb-2 block italic">
                            Authorization Level: Maximum
                        </span>
                        <h1 className="text-6xl font-black italic uppercase tracking-tighter neon-text leading-tight">
                            🎉 STEP 3이<br />열렸습니다
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-6"
                    >
                        <p className="text-xl font-bold text-white/80 leading-relaxed">
                            이제 원장님은 콘텐츠의<br />
                            <span className="text-brand-primary">구조와 메시지를 직접 설계</span>할 수 있습니다.
                        </p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-500 text-xs font-bold italic">
                            <ShieldCheck size={14} />
                            단, 의료 기준과 블로그 신뢰도는 계속 시스템이 보호합니다.
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="pt-6"
                >
                    <button
                        onClick={handleStart}
                        className="group w-full py-5 rounded-2xl bg-brand-primary text-black font-black uppercase text-lg tracking-widest hover:shadow-neon transition-all flex items-center justify-center gap-3"
                    >
                        STEP 3 시작하기
                        <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-[10px] text-gray-700 font-bold mt-4 uppercase tracking-widest">
                        Entering Full Operator Mode...
                    </p>
                </motion.div>
            </motion.div>

            {/* Floating Particles Simulation */}
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: Math.random() * window.innerWidth,
                        y: Math.random() * window.innerHeight,
                        opacity: 0
                    }}
                    animate={{
                        y: [null, Math.random() * -100],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 3 + Math.random() * 5,
                        repeat: Infinity,
                        delay: Math.random() * 5
                    }}
                    className="absolute w-1 h-1 bg-brand-primary/30 rounded-full"
                />
            ))}
        </div>
    );
};
