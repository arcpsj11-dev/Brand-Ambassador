import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const signup = useAuthStore((state) => state.signup);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isSignup) {
                if (id.length < 2 || pw.length < 4) {
                    setError('아이디는 2자 이상, 비밀번호는 4자 이상 입력해주세요.');
                    setIsLoading(false);
                    return;
                }
                const { success, error: signupError } = await signup(id, pw);
                if (success) {
                    alert('🎉 회원가입이 완료되었습니다! 이제 로그인해 주세요.');
                    setIsSignup(false);
                } else {
                    setError(signupError || '회원가입 실패 (알 수 없는 오류)');
                }
            } else {
                const { success, error: loginError } = await login(id, pw);
                if (!success) {
                    setError(loginError || '아이디 또는 비밀번호가 올바르지 않습니다.');
                }
            }
        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : String(err);
            setError(`치명적 오류: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

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
                    <h1 className="text-3xl font-black tracking-tight mb-2 uppercase italic text-brand-primary leading-none">Brand Ambassador</h1>
                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest opacity-70">AI Marketing Partner</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ArrowRight size={10} className="text-brand-primary" /> {isSignup ? 'NEW ID' : 'USER ID'}
                        </label>
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary/50 transition-all text-sm font-medium"
                            placeholder="아이디를 입력하세요"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <ArrowRight size={10} className="text-brand-primary" /> {isSignup ? 'NEW PASSWORD' : 'PASSWORD'}
                        </label>
                        <input
                            type="password"
                            value={pw}
                            onChange={(e) => setPw(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary/50 transition-all text-sm font-medium placeholder:opacity-30"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-red-400 text-[10px] text-center font-bold tracking-tight bg-red-400/10 py-2 rounded-lg border border-red-400/20"
                        >
                            {error}
                        </motion.p>
                    )}

                    <div className="space-y-3 pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-primary text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-neon hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-tight disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '처리 중...' : (isSignup ? '가입 완료하기' : '로그인 시작하기')}
                        </button>

                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => {
                                setIsSignup(!isSignup);
                                setError('');
                            }}
                            className="w-full bg-white/5 text-gray-400 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all border border-white/5 text-xs uppercase tracking-widest disabled:opacity-30"
                        >
                            {isSignup ? '기존 계정으로 로그인' : '회원가입 신청하기'}
                        </button>
                    </div>
                </form>

                {/* DB Connection Debug Status */}
                <div className="mt-8 pt-4 border-t border-white/5 flex flex-col items-center gap-1">
                    <div className={`text-[10px] font-bold flex items-center gap-2 ${isSupabaseConfigured ? 'text-green-500/50' : 'text-red-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                        {isSupabaseConfigured ? 'System Connected' : 'DB Configuration Missing'}
                    </div>
                    {!isSupabaseConfigured && (
                        <p className="text-[9px] text-red-400 text-center">
                            Environment variables (VITE_SUPABASE_URL) not detected.
                        </p>
                    )}
                </div>
            </motion.div>
        </div >
    );
};
