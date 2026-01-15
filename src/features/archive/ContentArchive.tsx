import React, { useState } from 'react';
import { useContentStore, type Content } from '../../store/useContentStore';
import { FileText, Calendar, Clock, Search, Copy, Check } from 'lucide-react';

export const ContentArchive: React.FC = () => {
    const { contents } = useContentStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContent, setSelectedContent] = useState<Content | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // 날짜 내림차순 정렬 (최신순)
    const sortedContents = [...contents].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const filteredContents = sortedContents.filter(content =>
        content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.body.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6">
            {/* 리스트 영역 */}
            <div className="w-1/3 glass-card flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <FileText className="text-brand-primary" />
                        콘텐츠 아카이브
                        <span className="text-sm font-normal text-gray-400 ml-auto">
                            {filteredContents.length}개
                        </span>
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="제목 또는 내용 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-brand-primary outline-none text-white placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {filteredContents.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            저장된 콘텐츠가 없습니다.
                        </div>
                    ) : (
                        filteredContents.map(content => (
                            <div
                                key={content.id}
                                onClick={() => setSelectedContent(content)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedContent?.id === content.id
                                    ? 'bg-brand-primary/10 border-brand-primary'
                                    : 'bg-white/5 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                <h3 className="font-bold text-white mb-1 truncate">{content.title}</h3>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(content.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${content.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {content.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 상세 보기 영역 */}
            <div className="flex-1 glass-card flex flex-col overflow-hidden relative">
                {selectedContent ? (
                    <>
                        <div className="p-6 border-b border-white/10 flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-2">{selectedContent.title}</h1>
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} />
                                        {formatDate(selectedContent.createdAt)}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleCopy(`${selectedContent.title}\n\n${selectedContent.body}`, selectedContent.id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
                            >
                                {copiedId === selectedContent.id ? (
                                    <>
                                        <Check size={16} className="text-green-500" />
                                        <span className="text-green-500">복사됨</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        <span>전체 복사</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="prose prose-invert max-w-none">
                                <div className="whitespace-pre-wrap leading-relaxed text-gray-300">
                                    {selectedContent.body}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <FileText size={48} className="mb-4 opacity-50" />
                        <p>목록에서 콘텐츠를 선택하여 내용을 확인하세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
