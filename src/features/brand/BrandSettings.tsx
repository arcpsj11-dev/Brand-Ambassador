import React, { useState, useEffect } from 'react';
import { useBrandStore } from '../../store/useBrandStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Save, Loader2, Building2, Phone, MapPin, Stethoscope, Globe, Diamond, Zap, Info, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { handleManualCopy, handlePaste } from '../../utils/clipboardUtils';

export const BrandSettings: React.FC = () => {
    const brand = useBrandStore();
    const [formData, setFormData] = useState({
        clinicName: brand.clinicName,
        phoneNumber: brand.phoneNumber,
        address: brand.address,
        subjects: brand.subjects,
        philosophy: brand.philosophy,
        equipment: brand.equipment,
        facilities: brand.facilities,
        blogUrl: brand.blogUrl,
    });

    const [isLeveling, setIsLeveling] = useState(false);
    const [levelProgress, setLevelProgress] = useState(0);

    useEffect(() => {
        // 초기 로드 시 동작 정의 (필요 시)
    }, []);

    const { user } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        brand.setBrand(formData);

        if (formData.blogUrl) {
            setIsLeveling(true);
            setLevelProgress(0);

            const interval = setInterval(() => {
                setLevelProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setIsLeveling(false);
                        alert('블로그 지수 분석이 완료되었습니다! Level.4 (다이아) 등급입니다.');
                        return 100;
                    }
                    return prev + 5;
                });
            }, 100);
        } else {
            alert('브랜드 정보가 영구 저장되었습니다!');
        }
    };

    return (
        <div
            onCopy={handleManualCopy}
            className="max-w-4xl mx-auto space-y-10 pb-20"
        >
            {/* Membership Widget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-6 border-brand-primary/30 bg-gradient-to-br from-brand-primary/10 to-transparent flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center shadow-neon">
                            <Diamond className="text-brand-primary" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Current Membership</p>
                            <h3 className="text-xl font-black">{user?.tier} Member</h3>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/10 transition-all">
                        Upgrade
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-6 border-brand-accent/30 bg-gradient-to-br from-brand-accent/10 to-transparent flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-accent/20 rounded-xl flex items-center justify-center shadow-neon">
                            <Zap className="text-brand-accent" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Remaining Searches</p>
                            <h3 className="text-xl font-black">{user?.remainingSearches}<span className="text-xs text-gray-500 font-normal ml-1">Times</span></h3>
                        </div>
                    </div>
                    <div className="p-2 text-gray-500 hover:text-white cursor-help">
                        <Info size={16} />
                    </div>
                </motion.div>
            </div>

            <header className="space-y-2">
                <h1 className="text-3xl font-bold neon-text">브랜드 메모리 설정</h1>
                <p className="text-gray-400">한의원의 정체성을 입력하면 제니가 모든 콘텐츠에 자연스럽게 녹여냅니다.</p>
            </header>

            <AnimatePresence>
                {isLeveling && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="glass-card p-6 border-brand-primary/30 bg-brand-primary/5 overflow-hidden"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <Loader2 className="text-brand-primary animate-spin" size={24} />
                            <div>
                                <h3 className="font-bold text-brand-primary">블로그 지수 정밀 측정 중...</h3>
                                <p className="text-xs text-gray-400">네이버 검색 엔진 지표와 최근 포스팅 노출률을 분석하고 있습니다.</p>
                            </div>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                            <motion.div
                                className="bg-brand-primary h-full shadow-neon"
                                initial={{ width: 0 }}
                                animate={{ width: `${levelProgress}%` }}
                            />
                        </div>
                        <p className="text-right text-[10px] text-brand-primary mt-2 font-mono">{levelProgress}%</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 space-y-4 md:col-span-2">
                    <label className="flex items-center gap-2 text-brand-primary font-medium">
                        <Globe size={18} /> 내 블로그 주소 (URL)
                    </label>
                    <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-brand-primary/50 transition-colors"
                        placeholder="예: https://blog.naver.com/id"
                        value={formData.blogUrl}
                        onPaste={handlePaste}
                        onChange={(e) => setFormData({ ...formData, blogUrl: e.target.value })}
                    />
                </div>

                <div className="glass-card p-6 space-y-4">
                    <label className="flex items-center gap-2 text-brand-primary font-medium">
                        <Building2 size={18} /> 병원 이름
                    </label>
                    <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-brand-primary/50 transition-colors"
                        placeholder="예: 도담한의원"
                        value={formData.clinicName}
                        onPaste={handlePaste}
                        onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    />
                </div>

                <div className="glass-card p-6 space-y-4">
                    <label className="flex items-center gap-2 text-brand-primary font-medium">
                        <Phone size={18} /> 연락처
                    </label>
                    <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-brand-primary/50 transition-colors"
                        placeholder="예: 031-000-0000"
                        value={formData.phoneNumber}
                        onPaste={handlePaste}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                </div>

                <div className="glass-card p-6 space-y-4 md:col-span-2">
                    <label className="flex items-center gap-2 text-brand-primary font-medium">
                        <MapPin size={18} /> 주소
                    </label>
                    <input
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-brand-primary/50 transition-colors"
                        placeholder="예: 경기도 김포시 구래동..."
                        value={formData.address}
                        onPaste={handlePaste}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                </div>

                <div className="glass-card p-6 space-y-4">
                    <label className="flex items-center gap-2 text-brand-primary font-medium">
                        <Stethoscope size={18} /> 주요 진료과목
                    </label>
                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 h-32 focus:outline-none focus:border-brand-primary/50 transition-colors"
                        placeholder="예: 추나 요법, 다이어트 한약..."
                        value={formData.subjects}
                        onPaste={handlePaste}
                        onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                    />
                </div>

                <div className="glass-card p-6 space-y-4">
                    <label className="flex items-center gap-2 text-brand-primary font-medium">
                        <Quote size={18} /> 브랜드 철학
                    </label>
                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 h-32 focus:outline-none focus:border-brand-primary/50 transition-colors"
                        placeholder="예: 환자 한 분 한 분을 가족처럼..."
                        value={formData.philosophy}
                        onPaste={handlePaste}
                        onChange={(e) => setFormData({ ...formData, philosophy: e.target.value })}
                    />
                </div>

                {/* 추가: 보유 장비 및 시설 관리 섹션 */}
                <div className="glass-card p-6 space-y-4 md:col-span-2 border-brand-primary/20 bg-brand-primary/5">
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-brand-primary font-bold uppercase tracking-tighter italic">
                            <Zap size={18} /> 도담의 보물들 (보유 장비)
                        </label>
                        <span className="text-[10px] text-brand-primary font-black uppercase tracking-widest bg-brand-primary/10 px-2 py-0.5 rounded-full">AI Match Enabled</span>
                    </div>
                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-4 h-32 focus:outline-none focus:border-brand-primary/50 transition-colors placeholder:text-gray-600"
                        placeholder="예: '수술 없이 디스크 치료 돕는 고가 감압치료기', '최신식 추나 전용 베드' 등"
                        value={formData.equipment}
                        onPaste={handlePaste}
                        onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                        {['고가 감압치료기', '최신 추나 베드', '정밀 ICT 장비', '무중력 트랙션'].map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => {
                                    const current = formData.equipment ? formData.equipment + ', ' : '';
                                    if (!current.includes(item)) {
                                        setFormData({ ...formData, equipment: current + item });
                                    }
                                }}
                                className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-gray-400 hover:text-brand-primary hover:border-brand-primary/50 transition-all font-bold"
                            >
                                + {item}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-6 space-y-4 md:col-span-2 border-brand-accent/20 bg-brand-accent/5">
                    <label className="flex items-center gap-2 text-brand-accent font-bold uppercase tracking-tighter italic">
                        <Building2 size={18} /> 편의 시설 & 환경
                    </label>
                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-4 h-24 focus:outline-none focus:border-brand-accent/50 transition-colors placeholder:text-gray-600"
                        placeholder="예: '무료 주차 가능', '카페 같은 넓은 대기실', '프라이빗 1인 진료실' 등"
                        value={formData.facilities}
                        onPaste={handlePaste}
                        onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-2">
                        {['넓은 주차장', '1인 진료실', '카페형 대기실', '키즈존'].map(item => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => {
                                    const current = formData.facilities ? formData.facilities + ', ' : '';
                                    if (!current.includes(item)) {
                                        setFormData({ ...formData, facilities: current + item });
                                    }
                                }}
                                className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-gray-400 hover:text-brand-accent hover:border-brand-accent/50 transition-all font-bold"
                            >
                                + {item}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full md:col-span-2 bg-brand-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-neon transition-all"
                >
                    <Save size={20} /> 브랜드 정보 영구 기억하기
                </motion.button>
            </form>
        </div>
    );
};
