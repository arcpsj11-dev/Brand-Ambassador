import React from 'react';
import { useKeywordStore, type KeywordGrade } from '../../store/useKeywordStore';
import { Diamond, Trophy, Medal, Award, Trash2, Undo2, Check, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GradeIcon = ({ grade }: { grade: KeywordGrade }) => {
    switch (grade) {
        case '다이아': return <Diamond className="text-cyan-400" size={20} />;
        case '골드': return <Trophy className="text-yellow-400" size={20} />;
        case '실버': return <Medal className="text-gray-300" size={20} />;
        case '브론즈': return <Award className="text-orange-400" size={20} />;
    }
};

export const KeywordVault: React.FC = () => {
    const { keywords, deleteKeyword, deleteKeywords, restoreKeyword, clearActiveKeywords } = useKeywordStore();
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

    const activeKeywords = keywords.filter(k => !k.isDeleted);
    const deletedKeywords = keywords.filter(k => k.isDeleted);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === activeKeywords.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(activeKeywords.map(k => k.id));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        if (confirm(`${selectedIds.length}개의 키워드를 삭제하시겠습니까?`)) {
            deleteKeywords(selectedIds);
            setSelectedIds([]);
        }
    };

    const handleClearAll = () => {
        if (confirm('보관소의 모든 활성 키워드를 삭제하시겠습니까?')) {
            clearActiveKeywords();
            setSelectedIds([]);
        }
    };

    return (
        <div className="p-6 space-y-8">
            <header className="flex justify-between items-end gap-6 flex-wrap">
                <div className="flex-1 min-w-[300px]">
                    <h1 className="text-3xl font-bold neon-text">키워드 계급 보관소</h1>
                    <p className="text-gray-400">네이버 검색량 대비 문서 수 비율로 산출된 황금 키워드 리스트입니다.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleClearAll}
                        disabled={activeKeywords.length === 0}
                        className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        Clear All
                    </button>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-red-500 text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all animate-in fade-in zoom-in"
                        >
                            Delete Selected ({selectedIds.length})
                        </button>
                    )}
                    <div className="glass-card px-4 py-2 flex items-center gap-2">
                        <Diamond size={16} className="text-cyan-400" />
                        <span className="text-sm font-bold uppercase">Diamonds: {activeKeywords.filter(k => k.grade === '다이아').length}</span>
                    </div>
                </div>
            </header>

            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={toggleAll}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                >
                    <div className={`w-4 h-4 rounded border border-white/20 flex items-center justify-center transition-colors ${selectedIds.length === activeKeywords.length && activeKeywords.length > 0 ? 'bg-brand-primary border-brand-primary' : ''}`}>
                        {selectedIds.length === activeKeywords.length && activeKeywords.length > 0 && <Check size={10} className="text-black" />}
                    </div>
                    {selectedIds.length === activeKeywords.length && activeKeywords.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                    {activeKeywords.map((keyword) => (
                        <motion.div
                            key={keyword.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -50 }}
                            className={`glass-card p-4 flex items-center justify-between group transition-all ${selectedIds.includes(keyword.id) ? 'border-brand-primary/50 bg-brand-primary/5' : 'hover:border-brand-primary/30'}`}
                        >
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => toggleSelect(keyword.id)}
                                    className="relative flex items-center justify-center"
                                >
                                    <div className={`w-5 h-5 rounded-lg border transition-all ${selectedIds.includes(keyword.id) ? 'bg-brand-primary border-brand-primary scale-110 shadow-neon-sm' : 'border-white/20 hover:border-brand-primary/50'}`} />
                                    {selectedIds.includes(keyword.id) && <Check size={12} className="absolute text-black font-black" />}
                                </button>
                                <GradeIcon grade={keyword.grade} />
                                <div>
                                    <h3 className="font-bold text-lg">{keyword.term}</h3>
                                    <div className="flex gap-4 text-[10px] font-medium text-gray-500 uppercase tracking-tight">
                                        <span>Vol: {keyword.searchVolume.toLocaleString()}</span>
                                        <span>Docs: {keyword.documentCount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <span className={`text-xl font-black italic ${keyword.ratio >= 1 ? 'neon-text' : 'text-white'}`}>
                                        {keyword.ratio}
                                    </span>
                                    <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black">Ratio Score</p>
                                </div>
                                <button
                                    onClick={() => deleteKeyword(keyword.id)}
                                    className="p-3 hover:bg-red-500/10 rounded-xl text-gray-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {activeKeywords.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-dashed border-white/10">
                            <Database size={24} className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">보관소가 비어있습니다.</p>
                    </div>
                )}
            </div>

            {deletedKeywords.length > 0 && (
                <section className="mt-12 space-y-6 pt-12 border-t border-white/5 opacity-50 transition-opacity hover:opacity-100">
                    <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
                        <Trash2 className="text-red-500/50" size={24} /> Recent Deletion Logs
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {deletedKeywords.map((keyword) => (
                            <div key={keyword.id} className="glass-card p-4 flex items-center justify-between bg-white/[0.02] border-dashed text-xs">
                                <span className="text-gray-500 font-medium line-through">{keyword.term}</span>
                                <button
                                    onClick={() => restoreKeyword(keyword.id)}
                                    className="flex items-center gap-2 text-brand-primary font-black uppercase tracking-widest text-[10px] hover:underline"
                                >
                                    <Undo2 size={14} /> Restore
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
