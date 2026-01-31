import React, { useState, useMemo, memo } from 'react';
import { useBrandStore } from '../../store/useBrandStore';
import { useKeywordStore } from '../../store/useKeywordStore';
import { Copy, Wand2, Image as ImageIcon, Video, Sparkles, Loader2, Check, Diamond } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { geminiReasoningService } from '../../services/geminiService';

// [Optimization] 전용 메모라이즈드 프리뷰 컴포넌트
const ContentPreview = memo(({ content, isGenerating }: { content: string; isGenerating: boolean }) => (
    <div className="flex-1 p-8 overflow-y-auto max-h-[600px] no-scrollbar relative">
        <AnimatePresence mode="wait">
            {!content && !isGenerating ? (
                <motion.div
                    key="empty"
                    initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-4"
                >
                    <Sparkles size={64} className="text-brand-primary" />
                    <p className="font-medium text-lg">왼쪽에서 키워드를 선택하고<br />제니의 원고 마법을 시작해보세요.</p>
                </motion.div>
            ) : (
                <motion.div
                    key="content"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="relative"
                >
                    <pre className="whitespace-pre-wrap font-sans text-gray-200 leading-relaxed text-lg italic animate-in fade-in duration-700">
                        {content}
                        {isGenerating && <span className="inline-block w-2 h-5 ml-1 bg-brand-primary animate-pulse" />}
                    </pre>
                </motion.div>
            )}
        </AnimatePresence>
        <div className="absolute bottom-8 right-8 opacity-[0.03] pointer-events-none">
            <Sparkles size={200} className="text-brand-primary" />
        </div>
    </div>
));

export const ContentFactory: React.FC = () => {
    const brand = useBrandStore();
    const { keywords } = useKeywordStore();
    const activeKeywords = useMemo(() => keywords.filter(k => !k.isDeleted), [keywords]);
    const [selectedKeyword, setSelectedKeyword] = useState(activeKeywords[0]?.term || '');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const generatePost = async () => {
        if (!selectedKeyword || isGenerating) return;

        setIsGenerating(true);
        setGeneratedContent('');

        const prompt = `
            사용자 선택 키워드: "${selectedKeyword}"
            도담한의원 마케팅을 위한 MZ세대 감성 블로그 원고를 작성하세요.
            반드시 포함할 정보:
            - 병원명: ${brand.clinicName}
            - 위치: ${brand.address}
            - 전화번호: ${brand.phoneNumber}
            - 말투: 똑똑하고 힙한 MZ 마케터 제니의 말투
        `;

        try {
            const stream = geminiReasoningService.generateStream(prompt, {
                clinicName: brand.clinicName || '나노바나나',
                address: brand.address || '김포시 운양동',
                phoneNumber: brand.phoneNumber || '010-0000-0000',
                blogIndex: brand.blogIndex
            });

            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk;
                // 이미지 플레이스홀더를 제외한 나머지 [ ] 태그 제거
                const filteredText = fullText.replace(/\[(?!IMAGE_PLACEHOLDER).*?\]/g, '');
                setGeneratedContent(filteredText);
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            setGeneratedContent("원장님, 제니 엔진에 바나나 껍질이 끼었나 봐요! 💦");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 p-4 pb-20">
            <header className="space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                    <Sparkles size={12} /> AI Content Engine 2.0
                </div>
                <h1 className="text-5xl font-black neon-text uppercase italic tracking-tighter leading-none">Content <br className="md:hidden" /> Factory</h1>
                <p className="text-gray-400 font-medium text-lg">데이터로 검증된 키워드가 제니의 손을 거쳐 고효율 원고로 탄생합니다.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 font-inter">
                {/* Left: Input Controls */}
                <div className="space-y-8">
                    <section className="glass-card p-8 space-y-6 bg-white/[0.02] border-white/10">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-xs flex items-center gap-3 text-gray-400 uppercase tracking-widest">
                                <div className="w-8 h-8 bg-brand-primary/20 rounded-lg flex items-center justify-center text-brand-primary shadow-neon-sm">01</div>
                                Select Target Keyword
                            </h3>
                            <span className="text-[10px] text-brand-primary font-bold">Total {activeKeywords.length} analysis active</span>
                        </div>
                        <select
                            value={selectedKeyword}
                            onChange={(e) => setSelectedKeyword(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 focus:outline-none focus:border-brand-primary/50 text-white transition-all text-lg font-bold shadow-inner"
                        >
                            <option value="">표적 키워드를 선택하세요</option>
                            {activeKeywords.map(k => (
                                <option key={k.id} value={k.term} className="bg-background text-white">{k.term} ({k.grade})</option>
                            ))}
                        </select>
                    </section>

                    <div className="grid grid-cols-2 gap-6">
                        <button className="glass-card p-8 flex flex-col items-center gap-4 border-brand-primary/10 hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                                <Diamond size={40} className="text-brand-primary" />
                            </div>
                            <ImageIcon size={40} className="text-brand-primary group-hover:scale-110 transition-transform mb-2" />
                            <span className="font-black text-sm uppercase tracking-tighter">AI Poster Design</span>
                        </button>
                        <button className="glass-card p-8 flex flex-col items-center gap-4 opacity-30 cursor-not-allowed grayscale border-white/5">
                            <Video size={40} className="text-gray-600 mb-2" />
                            <span className="font-black text-sm uppercase tracking-tighter">Short-Form Script</span>
                        </button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0,224,255,0.3)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={generatePost}
                        disabled={isGenerating || !selectedKeyword}
                        className="w-full bg-brand-primary text-black font-black py-8 rounded-3xl flex items-center justify-center gap-4 hover:shadow-neon transition-all disabled:opacity-30 disabled:grayscale text-xl uppercase italic tracking-tighter"
                    >
                        {isGenerating ? (
                            <><Loader2 className="animate-spin" size={28} /> 제니가 브레인 가동 중...</>
                        ) : (
                            <><Wand2 size={32} /> Generate Blog Content</>
                        )}
                    </motion.button>
                </div>

                {/* Right: Streaming Preview Panel */}
                <div className="glass-card bg-black/50 border border-white/10 flex flex-col shadow-2xl relative overflow-hidden min-h-[600px]">
                    <div className="bg-white/5 px-8 py-5 border-b border-white/10 flex justify-between items-center backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isGenerating ? 'bg-brand-primary animate-pulse shadow-neon' : 'bg-gray-700'}`} />
                            <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Live Script Preview</span>
                        </div>
                        {generatedContent && !isGenerating && (
                            <button
                                onClick={handleCopy}
                                className={`text-[11px] font-black flex items-center gap-2 transition-all px-4 py-2 rounded-xl border border-brand-primary/30 ${isCopied ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-black hover:shadow-neon'
                                    }`}
                            >
                                {isCopied ? <><Check size={14} /> COPIED!</> : <><Copy size={14} /> COPY CONTENT</>}
                            </button>
                        )}
                    </div>

                    <ContentPreview content={generatedContent} isGenerating={isGenerating} />
                </div>
            </div>
        </div>
    );
};

