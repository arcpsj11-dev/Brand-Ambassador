import React, { useState } from 'react';
import { useKeywordStore, type Keyword } from '../../store/useKeywordStore';
import { useBrandStore } from '../../store/useBrandStore';
import { calculateGrade } from '../../utils/keywordUtils';
import { Sparkles, Calendar, Diamond, Search, Loader2, Globe, MapPin, Building2, Trash2, Undo2, Database, Trophy, Medal, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/useChatStore';

export const MidnightScout: React.FC = () => {
    const brand = useBrandStore();
    const { addMessage } = useChatStore();
    const { keywords, addKeywords, deleteKeyword, restoreKeyword } = useKeywordStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isScouting, setIsScouting] = useState(false);
    const [scoutProgress, setScoutProgress] = useState(0);
    const [slotItems, setSlotItems] = useState<string[]>([]);

    const activeKeywords = keywords.filter((k: Keyword) => !k.isDeleted);
    const deletedKeywords = keywords.filter((k: Keyword) => k.isDeleted);

    const handleManualScout = async () => {
        if (!searchTerm.trim()) return;

        setIsScouting(true);
        setScoutProgress(0);
        setSlotItems([]);

        const city = brand.address?.split(' ')[1] || '해당';
        const season = '겨울(1월)';

        // 1. 제니 브리핑 (주도적 분석 프로세스)
        addMessage({
            role: 'assistant',
            content: `원장님, "${searchTerm}" 주제로 ${city} 지역 특성과 ${season} 트렌드를 분석해서 가장 힙한 키워드 10개를 뽑아봤어요! 지금 바로 데이터 정밀 탐사 시작할게요. 🧐`,
        });

        // 2. Gemini 2.0 AI 확장 로직 (시뮬레이션)
        const extendedKeywords = [
            `${city} ${searchTerm} 추천`,
            `${city} 근처 ${searchTerm} 잘하는곳`,
            `${season} 필수 ${searchTerm} 관리`,
            `${searchTerm} 솔직후기`,
            `${city} 24시 ${searchTerm}`,
            `${searchTerm} 부작용 피하는법`,
            `${city} ${searchTerm} 비용`,
            `연예인들이 선호하는 ${searchTerm}`,
            `직장인을 위한 ${city} ${searchTerm}`,
            `실패 없는 ${searchTerm} 고르는 팁`
        ];

        // 슬롯 애니메이션 시뮬레이션
        const totalSteps = 100;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep += 1;
            setScoutProgress(currentStep);

            if (currentStep >= totalSteps) {
                clearInterval(interval);

                // 데이터 매핑 및 보관소 추가
                const newKeywords: Keyword[] = extendedKeywords.map((term) => {
                    const searchVolume = Math.floor(Math.random() * 9000) + 1000;
                    const documentCount = Math.floor(Math.random() * 4000) + 50;
                    const ratio = parseFloat((searchVolume / documentCount).toFixed(2));
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        term,
                        searchVolume,
                        documentCount,
                        ratio,
                        grade: calculateGrade(ratio),
                        isDeleted: false
                    };
                });

                addKeywords(newKeywords);
                setIsScouting(false);
                setSearchTerm('');

                // 3. 최종 추천 (대화형 인터페이스)
                const diamondKeyword = newKeywords.find(k => k.grade === '다이아')?.term || newKeywords[0].term;
                setTimeout(() => {
                    addMessage({
                        role: 'assistant',
                        content: `원장님, 탐사 결과가 나왔어요! 10개 중 "${diamondKeyword}" 키워드가 경쟁 강도가 낮으면서도 검색량이 높은 '다이아' 등급이라 가장 추천드려요! 이걸로 첫 글을 써보는 건 어떠세요? 🔥`,
                    });
                }, 1000);
            }

            if (currentStep % 20 === 0) {
                setSlotItems((current: string[]) => [...current, `Slot ${current.length + 1} Captured`]);
            }
        }, 30);
    };

    return (
        <div className="space-y-10 pb-20">
            {/* 1. 상단: 브랜드 설정 요약 & 블로그 지수 */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass-card p-6 flex flex-wrap items-center gap-8 bg-brand-primary/5 border-brand-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-primary/20 rounded-full flex items-center justify-center">
                            <Building2 className="text-brand-primary" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Brand</p>
                            <h3 className="font-bold text-lg">{brand.clinicName || '병원을 등록해주세요'}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                            <MapPin className="text-gray-400" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Location</p>
                            <h3 className="font-medium text-gray-300">{brand.address || '주소 미등록'}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                            <Globe className="text-gray-400" size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Blog</p>
                            <h3 className="font-medium text-gray-300 truncate max-w-[150px]">{brand.blogUrl ? '연동 완료' : '주소 미등록'}</h3>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 bg-brand-accent/5 border-brand-accent/20 flex flex-col justify-center">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="font-bold text-xs italic flex items-center gap-2">
                            <Calendar size={14} /> 블로그 지수
                        </h3>
                        <span className="text-2xl font-black neon-text">Lv.4</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-primary h-full w-[45%] shadow-neon" />
                    </div>
                </div>
            </section>

            {/* 2. 중앙: Hero Input */}
            <section className="relative glass-card p-12 overflow-hidden flex flex-col items-center text-center space-y-8 bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />

                <div className="space-y-2">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                        어떤 키워드나 주제를 <span className="neon-text italic">탐사</span>할까요?
                    </h2>
                    <p className="text-gray-500 text-lg">제니가 네이버 데이터를 5개 슬롯으로 정밀 분석하여 다이아 키워드를 찾아냅니다.</p>
                </div>

                <div className="w-full max-w-3xl relative">
                    <div className="relative group">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualScout()}
                            placeholder="예: 다이어트 한약, 구래동 야간진료..."
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-8 py-6 text-xl focus:outline-none focus:border-brand-primary/50 focus:shadow-neon transition-all duration-500 pr-48"
                        />
                        <button
                            onClick={handleManualScout}
                            disabled={isScouting || !searchTerm.trim()}
                            className="absolute right-3 top-3 bottom-3 bg-brand-primary text-black px-6 rounded-xl font-bold flex items-center gap-2 hover:shadow-neon transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            {isScouting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                            다이아 탐사 시작
                        </button>
                    </div>

                    <AnimatePresence>
                        {isScouting && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-4 space-y-3"
                            >
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="bg-brand-primary h-full shadow-neon"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${scoutProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-center gap-4">
                                    {slotItems.map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-[10px] font-bold text-brand-primary uppercase bg-brand-primary/10 px-2 py-1 rounded border border-brand-primary/20"
                                        >
                                            Slot 0{i + 1} OK
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* 3. 하단: 키워드 보관소 통합 */}
            <section className="space-y-6">
                <div className="flex justify-between items-end px-2">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Database className="text-brand-primary" size={24} /> 탐사 결과 보관소
                        </h2>
                        <p className="text-gray-500 text-sm">최근 탐사된 키워드들이 등급별로 자동 저장됩니다.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="glass-card px-4 py-2 text-xs flex items-center gap-2">
                            <Diamond size={14} className="text-cyan-400" />
                            <span>다이아: {activeKeywords.filter(k => k.grade === '다이아').length}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <AnimatePresence>
                        {activeKeywords.length > 0 ? (
                            activeKeywords.map((keyword: Keyword) => (
                                <motion.div
                                    key={keyword.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass-card p-5 flex items-center justify-between hover:border-brand-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`p-3 rounded-xl bg-white/5 group-hover:bg-brand-primary/10 transition-colors`}>
                                            <GradeIcon grade={keyword.grade} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-brand-primary transition-colors">{keyword.term}</h3>
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span>검색량: {keyword.searchVolume.toLocaleString()}</span>
                                                <span>문서수: {keyword.documentCount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${keyword.ratio >= 1 ? 'neon-text' : 'text-white'}`}>
                                                {keyword.ratio}
                                            </span>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Ratio</p>
                                        </div>
                                        <button
                                            onClick={() => deleteKeyword(keyword.id)}
                                            className="p-3 hover:bg-red-500/10 rounded-xl text-gray-600 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="glass-card p-20 text-center opacity-20 flex flex-col items-center gap-4">
                                <Search size={48} />
                                <p>탐사 버튼을 눌러 첫 번째 다이아 키워드를 찾아보세요.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {deletedKeywords.length > 0 && (
                    <section className="mt-12 space-y-4 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                        <h3 className="text-lg font-bold flex items-center gap-2 px-2">
                            <Trash2 size={18} /> 최근 삭제된 키워드
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {deletedKeywords.map((keyword: Keyword) => (
                                <div key={keyword.id} className="glass-card p-4 flex items-center justify-between border-dashed">
                                    <span className="text-gray-500 line-through">{keyword.term}</span>
                                    <button
                                        onClick={() => restoreKeyword(keyword.id)}
                                        className="flex items-center gap-2 text-brand-primary text-sm font-medium hover:underline px-3 py-1 bg-brand-primary/5 rounded-lg"
                                    >
                                        <Undo2 size={16} /> 복구
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </section>
        </div>
    );
};

// Internal Components
const GradeIcon = ({ grade }: { grade: string }) => {
    switch (grade) {
        case '다이아': return <Diamond className="text-cyan-400" size={20} />;
        case '골드': return <Trophy className="text-yellow-400" size={20} />;
        case '실버': return <Medal className="text-gray-300" size={20} />;
        case '브론즈': return <Award className="text-orange-400" size={20} />;
        default: return null;
    }
};
