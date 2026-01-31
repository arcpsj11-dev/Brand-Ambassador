import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Target,
    Layers,
    RefreshCw,
<<<<<<< HEAD
    CheckCircle2,
    ArrowRight
=======
    RotateCcw,
    CheckCircle2,
    ArrowRight,
    Pencil
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
} from 'lucide-react';
import { useSlotStore } from '../../store/useSlotStore';
import { geminiReasoningService } from '../../services/geminiService';
import { useTopicStore } from '../../store/useTopicStore'; // [NEW]
import { batchInsertTopics, deleteAllTopicsForSlot } from '../../services/topicClusterService'; // [NEW]
import { useAuthStore } from '../../store/useAuthStore'; // [NEW]

import { usePlannerStore } from '../../store/usePlannerStore'; // [NEW]

interface TopicClusterGeneratorProps {
    slotId: string;
    onComplete?: () => void;
}

export const TopicClusterGenerator: React.FC<TopicClusterGeneratorProps> = ({ slotId, onComplete }) => {
    const { slots, updateSlot } = useSlotStore();
    // [NEW] Use persistent state with slot isolation
    const {
        // clusters, // [FIX] Don't use global clusters here
        currentClusterIndex,
        currentTopicIndex,
        setClusters,
        setCurrentTopic,
        resetTopics,
    } = useTopicStore();

    // Derived state for this slot (Not using getSlotData anymore)
    // const slotStats = getSlotData(slotId);
    // const clusters = slotStats?.clusters || [];
    // const currentClusterIndex = slotStats?.currentClusterIndex || 0;
    // const currentTopicIndex = slotStats?.currentTopicIndex || 0;

    const { clearPlanner } = usePlannerStore(); // [NEW]
    const slot = slots.find(s => s.slotId === slotId);

    const [keyword, setKeyword] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
<<<<<<< HEAD
=======
    const [regeneratingIndex, setRegeneratingIndex] = useState<{ cIdx: number, sIdx: number } | null>(null);
    const [editingIndex, setEditingIndex] = useState<{ cIdx: number, sIdx: number } | null>(null);
    const [editValue, setEditValue] = useState('');
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
    // Remove local preview state, rely on store (or use local just for confirmation)
    const [previewClusters, setPreviewClusters] = useState<any[] | null>(null);

    // [FIX] Reset local state when slot changes
    React.useEffect(() => {
        setPreviewClusters(null);
        setKeyword('');
    }, [slotId]);

    // [FIX] Use slot's own data for persistent view, NOT the global store
    // This ensures that even if useTopicStore is out of sync, the UI shows the correct slot data
    const slotClusters = slot?.clusters || [];
    const activeClusters = previewClusters || (slotClusters.length > 0 ? slotClusters : null);
    const isPreview = !!previewClusters;

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
            // data.clusters is the array (TopicCluster[])
            if (data.clusters) {
                setPreviewClusters(data.clusters);
            }
        } catch (error: any) {
            console.error(error);
            if (error?.message === "USAGE_LIMIT_REACHED") {
                alert("원장님, 이번 달(또는 현재 등급)의 AI 생성 사용 한도에 도달했습니다.\n\n한도 증액이나 등급 상향은 관리자에게 문의해 주세요! 🍌🚀");
            } else {
                alert('주제 생성 중 오류가 발생했습니다. API 키 설정을 확인해주세요.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = async () => {
        if (!previewClusters || previewClusters.length === 0) return;

        // All persistence now handled inside setClusters(slotId, previewClusters)
        setClusters(slotId, previewClusters); // [FIX] Pass slotId to ensure slot isolation

        // [NEW] Batch insert to content_clusters table
        const userId = useAuthStore.getState().user?.id;
        if (userId && slotId) {
            const result = await batchInsertTopics(userId, slotId, previewClusters);
            if (!result.success) {
                console.error('[TopicClusterGenerator] Batch insert failed:', result.error);
                alert(`주제 저장 실패: ${result.error}\n\nZustand에는 저장되었지만 DB 동기화에 실패했습니다.`);
            } else {
                console.log(`[TopicClusterGenerator] Successfully inserted ${result.insertedCount} topics to DB`);
            }
        }

        if (onComplete) onComplete();
        setPreviewClusters(null); // Clear preview, falls back to store
        setKeyword('');
    };

<<<<<<< HEAD
=======
    const handleEditStart = (cIdx: number, sIdx: number, currentTitle: string) => {
        setEditingIndex({ cIdx, sIdx });
        setEditValue(currentTitle);
    };

    const handleEditSave = async (cIdx: number, sIdx: number) => {
        if (!editValue.trim()) return;
        await useTopicStore.getState().updateTopicTitle(slotId, cIdx, sIdx, editValue);
        setEditingIndex(null);
    };

    const handleRegenerate = async (cIdx: number, sIdx: number, originalTitle: string) => {
        setRegeneratingIndex({ cIdx, sIdx });
        try {
            const newTitle = await geminiReasoningService.regenerateTopicTitle(originalTitle, {
                jobTitle: slot.personaSetting.jobTitle,
                toneAndManner: slot.personaSetting.toneAndManner
            });
            await useTopicStore.getState().updateTopicTitle(slotId, cIdx, sIdx, newTitle);
        } catch (error) {
            console.error("Regeneration failed:", error);
            alert("주제 재생성에 실패했습니다.");
        } finally {
            setRegeneratingIndex(null);
        }
    };

>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
    const handleReset = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (window.confirm("현재 진행 중인 30일 플랜을 초기화하시겠습니까?\n(작성 중인 데이터와 매칭된 주제 리스트가 모두 삭제됩니다.)")) {
            // 1. Clear Local Preview
            setPreviewClusters(null);

            // 2. [NEW] Delete from content_clusters DB table
            const deleteResult = await deleteAllTopicsForSlot(slotId);
            if (!deleteResult.success) {
                console.error('[TopicClusterGenerator] Failed to delete topics from DB:', deleteResult.error);
            }

            // 3. [DEEP PURGE] Delete all articles for this slot
            const { useContentStore } = await import('../../store/useContentStore');
            await useContentStore.getState().purgeSlotArticles(slotId);

            // 3. Reset Topics (Now handles Slot Store reset too)
            resetTopics();

            // 4. Clear Planner Store (Now handles Slot Store reset too)
            clearPlanner();

            alert("모든 플랜 데이터가 초기화되었습니다. 새로운 키워드로 전략을 생성해보세요.");
        }
    }


    return (
        <div className="space-y-6">
            {!activeClusters ? (
                // 1. [EMPTY STATE] Search Input
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
                // 2. [ACTIVE / PREVIEW STATE] List
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="text-brand-primary" />
                            {isPreview ? "Generated Preview (Not Saved)" : "Active 30-Day Plan"}
                        </h4>
                        <div className="flex gap-2">
                            {/* Only show 'Reset' (Clear) if it's persistent data, or 'Cancel' if preview */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isPreview) {
                                        setPreviewClusters(null);
                                    } else {
                                        handleReset(e);
                                    }
                                }}
                                className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 hover:text-red-400 hover:border-red-400/30 uppercase transition-all"
                            >
                                {isPreview ? "Cancel" : "Reset Plan"}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {activeClusters.map((cluster: any, cIdx: number) => {
                            const pillar = cluster.topics.find((t: any) => t.type === 'pillar');
                            const satellites = cluster.topics.filter((t: any) => t.type === 'supporting');

                            return (
                                <div key={cIdx} className="space-y-2">
                                    <div
                                        onClick={() => {
                                            if (!isPreview) {
                                                setCurrentTopic(cIdx, 0); // Pillar is always index 0
                                                updateSlot(slotId, {
                                                    currentCluster: {
                                                        ...slot.currentCluster,
                                                        currentIndex: 0
                                                    }
                                                });
                                            }
                                        }}
                                        className={`p-4 rounded-xl border relative overflow-hidden group/pillar cursor-pointer transition-all
                                            ${pillar?.isPublished
                                                ? 'bg-brand-primary/20 border-brand-primary/50'
                                                : (cIdx === currentClusterIndex && currentTopicIndex === 0)
                                                    ? 'bg-white/10 border-brand-primary shadow-neon shadow-brand-primary/20'
                                                    : 'bg-brand-primary/10 border-brand-primary/30 hover:bg-white/10 hover:border-white/30'
                                            }
                                        `}
                                    >
                                        <div className="absolute top-0 right-0 bg-brand-primary text-black text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter flex items-center gap-1">
                                            {pillar?.isPublished && <CheckCircle2 size={8} />}
                                            Cluster {cIdx + 1} Pillar
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Layers size={16} className={`${pillar?.isPublished ? 'text-brand-primary' : 'text-brand-primary'} shrink-0 mt-0.5`} />
                                            <p className={`text-sm font-black ${pillar?.isPublished ? 'text-white line-through opacity-50' : 'text-white'}`}>
                                                {pillar?.title || cluster.category}
                                            </p>
                                        </div>
                                        {/* Hover Badge */}
                                        {!isPreview && !pillar?.isPublished && !(cIdx === currentClusterIndex && currentTopicIndex === 0) && (
                                            <div className="absolute right-3 bottom-2 opacity-0 group-hover/pillar:opacity-100 transition-opacity">
                                                <span className="text-[9px] bg-white text-black px-1.5 py-0.5 rounded font-bold uppercase">Select Pillar</span>
                                            </div>
                                        )}
                                        {/* Active Indicator */}
                                        {!isPreview && cIdx === currentClusterIndex && currentTopicIndex === 0 && (
                                            <div className="absolute right-3 bottom-2">
                                                <span className="text-[9px] bg-brand-primary text-black px-1.5 py-0.5 rounded font-black uppercase shadow-neon">Active</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pl-4 border-l-2 border-white/5 space-y-2">
                                        {satellites.map((sat: any, sIdx: number) => {
                                            // Calculate global index (simulated for simplicity, or strictly based on logic)
                                            // Pillar is Topic 0 of cluster. Satellites are 1..9.
                                            // Store tracks by clusterIndex and topicIndex.
                                            // This loop is for display.
                                            // Need to find if THIS specific topic is active or done.

                                            // Logic: 
                                            // cIdx < currentClusterIndex => DONE (All topics in prev clusters done?) - Assuming sequential
                                            // cIdx === currentClusterIndex:
                                            //    active if sIdx+1 === currentTopicIndex (assuming Pillar is 0)
                                            // Actually use t.isPublished from Store

                                            // Note: 'sat' here is a topic object.
                                            const isDone = sat.isPublished;
<<<<<<< HEAD
                                            // Active if: (This Cluster is Current) AND (This Topic Index is Current)
                                            // Satellites index in 'topics' array: 1 + sIdx
                                            // Because 0 is pillar.
                                            const topicRealIndex = 1 + sIdx;
                                            const isActive = !isPreview && (cIdx === currentClusterIndex && topicRealIndex === currentTopicIndex);
=======
                                            const topicRealIndex = 1 + sIdx;
                                            const isActive = !isPreview && (cIdx === currentClusterIndex && topicRealIndex === currentTopicIndex);
                                            const isEditingThis = editingIndex?.cIdx === cIdx && editingIndex?.sIdx === topicRealIndex;
                                            const isRegeneratingThis = regeneratingIndex?.cIdx === cIdx && regeneratingIndex?.sIdx === topicRealIndex;
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)

                                            return (
                                                <div key={sIdx}
                                                    onClick={() => {
<<<<<<< HEAD
                                                        // [SYNC] Set global current topic on click
                                                        if (!isPreview) {
                                                            setCurrentTopic(cIdx, topicRealIndex);
                                                            // Also update Slot Store visual (optional, but good for consistency)
=======
                                                        if (!isPreview && !isEditingThis) {
                                                            setCurrentTopic(cIdx, topicRealIndex);
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
                                                            updateSlot(slotId, {
                                                                currentCluster: {
                                                                    ...slot.currentCluster,
                                                                    currentIndex: topicRealIndex
                                                                }
                                                            });
                                                        }
                                                    }}
                                                    className={`p-3 rounded-lg border transition-all flex items-start gap-3 cursor-pointer relative group/item
                                                        ${isDone
<<<<<<< HEAD
                                                            ? 'bg-brand-primary/20 border-brand-primary/50' // Done
                                                            : isActive
                                                                ? 'bg-white/10 border-brand-primary shadow-neon shadow-brand-primary/20 scale-[1.02] z-10' // Active
                                                                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10' // Pending
                                                        }
                                                    `}
                                                >
                                                    <span className={`font-mono font-bold text-xs ${isDone ? 'text-brand-primary' : 'text-gray-600'}`}>
                                                        {isDone ? <CheckCircle2 size={14} /> : String(sIdx + 1).padStart(2, '0')}
                                                    </span>
                                                    <p className={`text-xs font-bold ${isDone ? 'text-white line-through opacity-50' : isActive ? 'text-white' : 'text-gray-300'}`}>
                                                        {sat.title}
                                                    </p>

                                                    {/* Active Badge */}
                                                    {isActive && <div className="ml-auto text-[8px] bg-brand-primary text-black px-1.5 rounded font-black uppercase">Next</div>}

                                                    {/* Hover Badge (Click to Select) */}
                                                    {!isActive && !isDone && !isPreview && (
                                                        <div className="absolute right-3 top-3 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                            <span className="text-[9px] bg-white text-black px-1.5 py-0.5 rounded font-bold uppercase">Select</span>
                                                        </div>
                                                    )}
=======
                                                            ? 'bg-brand-primary/20 border-brand-primary/50'
                                                            : isActive
                                                                ? 'bg-white/10 border-brand-primary shadow-neon shadow-brand-primary/20 scale-[1.02] z-10'
                                                                : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                                                        }
                                                    `}
                                                >
                                                    <span className={`font-mono font-bold text-xs shrink-0 mt-0.5 ${isDone ? 'text-brand-primary' : 'text-gray-600'}`}>
                                                        {isDone ? <CheckCircle2 size={14} /> : String(sIdx + 1).padStart(2, '0')}
                                                    </span>

                                                    <div className="flex-1 min-w-0">
                                                        {isEditingThis ? (
                                                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                                                <input
                                                                    autoFocus
                                                                    className="flex-1 bg-white/10 border border-brand-primary/30 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                                                    value={editValue}
                                                                    onChange={e => setEditValue(e.target.value)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') handleEditSave(cIdx, topicRealIndex);
                                                                        if (e.key === 'Escape') setEditingIndex(null);
                                                                    }}
                                                                />
                                                                <button onClick={() => handleEditSave(cIdx, topicRealIndex)} className="text-brand-primary hover:text-white transition-colors">
                                                                    <CheckCircle2 size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <p className={`text-xs font-bold leading-relaxed truncate ${isDone ? 'text-white line-through opacity-50' : isActive ? 'text-white' : 'text-gray-300'}`}>
                                                                {sat.title}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    {!isPreview && !isDone && !isEditingThis && (
                                                        <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleRegenerate(cIdx, topicRealIndex, sat.title);
                                                                }}
                                                                disabled={isRegeneratingThis}
                                                                className="p-1 hover:text-brand-primary text-gray-500 transition-colors"
                                                                title="재생성"
                                                            >
                                                                {isRegeneratingThis ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditStart(cIdx, topicRealIndex, sat.title);
                                                                }}
                                                                className="p-1 hover:text-brand-primary text-gray-500 transition-colors"
                                                                title="수정"
                                                            >
                                                                <Pencil size={12} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {isActive && !isEditingThis && <div className="ml-auto text-[8px] bg-brand-primary text-black px-1.5 rounded font-black uppercase shrink-0">Next</div>}
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {isPreview && (
                        <button
                            onClick={handleApply}
                            className="w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest shadow-neon hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <span>Apply Full Plan (30 Days)</span>
                            <ArrowRight size={18} />
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
};
