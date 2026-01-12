import React from 'react';
import { useKeywordStore, type KeywordGrade } from '../../store/useKeywordStore';
import { Diamond, Trophy, Medal, Award, Trash2, Undo2 } from 'lucide-react';
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
    const { keywords, deleteKeyword, restoreKeyword } = useKeywordStore();
    const activeKeywords = keywords.filter(k => !k.isDeleted);
    const deletedKeywords = keywords.filter(k => k.isDeleted);

    return (
        <div className="p-6 space-y-8">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold neon-text">키워드 계급 보관소</h1>
                    <p className="text-gray-400">네이버 검색량 대비 문서 수 비율로 산출된 황금 키워드 리스트입니다.</p>
                </div>
                <div className="flex gap-4">
                    <div className="glass-card px-4 py-2 flex items-center gap-2">
                        <Diamond size={16} className="text-cyan-400" />
                        <span className="text-sm">다이아: {activeKeywords.filter(k => k.grade === '다이아').length}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                    {activeKeywords.map((keyword) => (
                        <motion.div
                            key={keyword.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="glass-card p-4 flex items-center justify-between hover:border-brand-primary/30 transition-colors"
                        >
                            <div className="flex items-center gap-6">
                                <GradeIcon grade={keyword.grade} />
                                <div>
                                    <h3 className="font-bold text-lg">{keyword.term}</h3>
                                    <div className="flex gap-4 text-xs text-gray-500">
                                        <span>검색량: {keyword.searchVolume.toLocaleString()}</span>
                                        <span>문서수: {keyword.documentCount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <span className={`text-xl font-black ${keyword.ratio >= 1 ? 'neon-text' : 'text-white'}`}>
                                        {keyword.ratio}
                                    </span>
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">Ratio</p>
                                </div>
                                <button
                                    onClick={() => deleteKeyword(keyword.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {deletedKeywords.length > 0 && (
                <section className="mt-12 space-y-4 opacity-50">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Trash2 size={20} /> 최근 삭제된 키워드 (3일 이내 복구 가능)
                    </h2>
                    <div className="grid grid-cols-1 gap-2">
                        {deletedKeywords.map((keyword) => (
                            <div key={keyword.id} className="glass-card p-4 flex items-center justify-between bg-white/2 border-dashed">
                                <span className="text-gray-400LineThrough decoration-gray-600">{keyword.term}</span>
                                <button
                                    onClick={() => restoreKeyword(keyword.id)}
                                    className="flex items-center gap-2 text-brand-primary text-sm font-medium hover:underline"
                                >
                                    <Undo2 size={16} /> 복구하기
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};
