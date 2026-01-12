import React, { useState } from 'react';
import { useBrandStore } from '../../store/useBrandStore';
import { useKeywordStore } from '../../store/useKeywordStore';
import { Copy, Wand2, Image as ImageIcon, Video, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const ContentFactory: React.FC = () => {
    const brand = useBrandStore();
    const { keywords } = useKeywordStore();
    const [selectedKeyword, setSelectedKeyword] = useState(keywords[0]?.term || '');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePost = () => {
        setIsGenerating(true);
        // MZ 감성 로직 시뮬레이션
        setTimeout(() => {
            const content = `[${selectedKeyword}] 이 조합은 못 참지..🔥 

안녕 원장님들! 오늘은 ${brand.clinicName}에서 전해드리는 힙한 건강 정보야.
솔직히 ${brand.address} 근처에서 여기 모르면 손해인 거 RGRG? 😎

"${selectedKeyword}" 때문에 고민이라면? 
우린 그냥 치료만 하는 게 아니라, ${brand.philosophy.slice(0, 30)}... 이런 폼 미친 철학으로 관리해드림!

문의는 이쪽으로 📞 ${brand.phoneNumber}
#${brand.clinicName.replace(/\s/g, '')} #김포한의원 #MZ감성 #오운완`;
            setGeneratedContent(content);
            setIsGenerating(false);
        }, 1500);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-4">
            <header>
                <h1 className="text-3xl font-bold neon-text">콘텐츠 팩토리</h1>
                <p className="text-gray-400">키워드 하나로 블로그, 포스터, 숏폼 대본까지 한 번에.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 font-inter">
                <div className="space-y-6">
                    <section className="glass-card p-6 space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                            <Sparkles size={18} className="text-brand-primary" /> 키워드 선택
                        </h3>
                        <select
                            value={selectedKeyword}
                            onChange={(e) => setSelectedKeyword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-brand-primary/50 text-white"
                        >
                            {keywords.filter(k => !k.isDeleted).map(k => (
                                <option key={k.id} value={k.term} className="bg-background text-white">{k.term} ({k.grade})</option>
                            ))}
                        </select>
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="glass-card p-6 flex flex-col items-center gap-3 border-brand-primary/20 hover:neon-border transition-all">
                            <ImageIcon size={32} className="text-brand-primary" />
                            <span className="font-bold">포스터 디자인</span>
                        </button>
                        <button className="glass-card p-6 flex flex-col items-center gap-3 opacity-50 cursor-not-allowed">
                            <Video size={32} className="text-gray-500" />
                            <span className="font-bold text-gray-500">숏폼 스토리보드</span>
                        </button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={generatePost}
                        disabled={isGenerating}
                        className="w-full bg-brand-primary text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:shadow-neon transition-all"
                    >
                        {isGenerating ? '제니가 고민 중...' : <><Wand2 size={20} /> MZ세대 감성 블로그 원고 생성</>}
                    </motion.button>
                </div>

                <div className="glass-card p-1 bg-gradient-to-b from-white/10 to-transparent min-h-[500px] flex flex-col">
                    <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center rounded-t-2xl">
                        <span className="text-xs font-bold text-brand-primary uppercase tracking-tighter">Preview</span>
                        {generatedContent && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedContent);
                                    alert('복사되었습니다!');
                                }}
                                className="text-xs text-gray-400 flex items-center gap-2 hover:text-white transition-colors"
                            >
                                <Copy size={14} /> 복사하기
                            </button>
                        )}
                    </div>
                    <div className="flex-1 p-8">
                        {isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-4">
                                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
                                <p className="text-brand-primary font-bold animate-pulse text-sm">콘텐츠 팩토리 가동 중...</p>
                            </div>
                        ) : generatedContent ? (
                            <pre className="whitespace-pre-wrap font-sans text-gray-200 leading-relaxed text-lg italic">
                                {generatedContent}
                            </pre>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                <Sparkles size={64} className="mb-4" />
                                <p>왼쪽에서 키워드를 선택하고<br />원고 생성을 눌러주세요.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
