import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Target,
    Layers,
    RefreshCw,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { useSlotStore } from '../../store/useSlotStore';
import { geminiReasoningService } from '../../services/geminiService';

interface TopicClusterGeneratorProps {
    slotId: string;
    onComplete?: () => void;
}

export const TopicClusterGenerator: React.FC<TopicClusterGeneratorProps> = ({ slotId, onComplete }) => {
    const { slots, updateSlot } = useSlotStore();
    const slot = slots.find(s => s.slotId === slotId);

    const [keyword, setKeyword] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewCluster, setPreviewCluster] = useState<{ pillarTitle: string, satelliteTitles: string[] } | null>(null);

    if (!slot) return null;

    const handleGenerate = async () => {
        if (!keyword.trim()) {
            alert('키워드를 입력해주세요.');
            return;
        }

        setIsGenerating(true);
        try {
            const data = await geminiReasoningService.generateTopicCluster(
                keyword,
                {
                    jobTitle: slot.personaSetting.jobTitle,
                    toneAndManner: slot.personaSetting.toneAndManner
                }
            );
            setPreviewCluster({
                pillarTitle: data.pillarTitle,
                satelliteTitles: data.satelliteTitles
            });
        } catch (error: unknown) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === "API_KEY_MISSING") {
                alert("관리자 설정에서 Gemini API Key를 먼저 설정해주세요.");
            } else {
                alert(`주제 생성 중 오류가 발생했습니다: ${errorMessage}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        if (!previewCluster) return;

        updateSlot(slotId, {
            currentCluster: {
                pillarTitle: previewCluster.pillarTitle,
                satelliteTitles: previewCluster.satelliteTitles,
                currentIndex: 1 // 리셋
            }
        });

        if (onComplete) onComplete();
        alert('토픽 클러스터가 성공적으로 적용되었습니다.');
        setPreviewCluster(null);
        setKeyword('');
    };

    return (
        <div className="space-y-6">
            {!previewCluster ? (
                <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10">
                        <p className="text-xs text-brand-primary font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Target size={14} /> Topic Strategy
                        </p>
                        <p className="text-sm text-gray-400 leading-relaxed font-medium">
                            슬롯의 성격에 맞는 핵심 키워드를 입력해주세요. <br />
                            나머지는 제가 알아서 제목을 찾아드리겠습니다.
                        </p>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            placeholder="예: 교통사고 후유증, 다이어트 한약, 임플란트..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white font-bold placeholder:text-gray-600 focus:outline-none focus:border-brand-primary/30 transition-all font-mono"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !keyword.trim()}
                            className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-brand-primary text-black font-black uppercase text-[10px] tracking-widest hover:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                        >
                            {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : 'Generate'}
                        </button>
                    </div>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-brand-primary" /> Generated Cluster Map
                        </h4>
                        <button
                            onClick={() => setPreviewCluster(null)}
                            className="text-[10px] font-bold text-gray-500 hover:text-white uppercase"
                        >
                            Reset
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Pillar Topic */}
                        <div className="p-4 rounded-xl bg-brand-primary/10 border border-brand-primary/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 bg-brand-primary text-black text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter">Pillar Post</div>
                            <div className="flex items-start gap-3">
                                <span className="text-brand-primary font-mono font-black">01</span>
                                <p className="text-sm font-black text-white">{previewCluster.pillarTitle}</p>
                            </div>
                        </div>

                        {/* Satellite Topics */}
                        {previewCluster.satelliteTitles.map((title, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                                <div className="flex items-start gap-3">
                                    <span className="text-gray-600 font-mono font-bold">{String(idx + 2).padStart(2, '0')}</span>
                                    <p className="text-sm font-bold text-gray-300">{title}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleApply}
                        className="w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest shadow-neon hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                        <span>Apply This Cluster</span>
                        <ArrowRight size={18} />
                    </button>
                </motion.div>
            )}

            {/* Empty State / Current Strategy */}
            {!previewCluster && slot.currentCluster.pillarTitle && (
                <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3">Currently Active Strategy</p>
                    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <Layers size={14} className="text-gray-500" />
                            <span className="text-xs font-bold text-gray-400 truncate max-w-[200px]">{slot.currentCluster.pillarTitle}</span>
                        </div>
                        <CheckCircle2 size={12} className="text-brand-primary opacity-50" />
                    </div>
                </div>
            )}
        </div>
    );
};
