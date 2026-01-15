import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Sparkles, User, Key, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');
    const login = useAuthStore((state) => state.login);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const success = login(id, pw);
        if (!success) {
            setError('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-accent/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md p-8 glass-card border-white/10 relative z-10"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-neon mb-6">
                        <Sparkles className="text-black" size={32} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">JENNY MARKETER</h1>
                    <p className="text-gray-500 text-sm">MZ세대 AI 마케팅 비서 제니에 로그인하세요</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} /> User ID
                        </label>
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary/50 transition-all text-sm"
                            placeholder="아이디를 입력하세요"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Key size={12} /> Password
                        </label>
                        <input
                            type="password"
                            value={pw}
                            onChange={(e) => setPw(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary/50 transition-all text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

                    <button
                        type="submit"
                        className="w-full bg-brand-primary text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-neon transition-all"
                    >
                        로그인 시작하기 <ArrowRight size={18} />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setId('new_user');
                            setPw('1234');
                            alert('🎉 회원가입이 완료되었습니다! (테스트 모드: 아이디가 자동으로 입력됩니다)');
                        }}
                        className="w-full bg-white/5 text-gray-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                    >
                        <User size={18} /> 회원가입 신청하기
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                    <div className="bg-white/5 rounded-xl p-4 text-[10px] text-gray-500 space-y-2">
                        <p className="flex items-center gap-2 text-brand-primary font-bold">
                            <ShieldCheck size={12} /> 테스트 계정 정보
                        </p>
                        <div className="flex justify-between">
                            <span>관리자: admin / admin123</span>
                            <span>다이아: diamond / 1234</span>
                        </div>
                        <div className="flex justify-between">
                            <span>일반: user / user123</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div >
    );
};
