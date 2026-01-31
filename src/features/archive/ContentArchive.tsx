import React, { useState } from 'react';
import { useContentStore, type Content } from '../../store/useContentStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useBrandStore } from '../../store/useBrandStore';
import { geminiReasoningService } from '../../services/geminiService';
import { useProfileStore } from '../../store/useProfileStore';
<<<<<<< HEAD
import { FileText, Calendar, Clock, Search, Copy, Check, Wand2, Loader2, X } from 'lucide-react';
=======
import { FileText, Calendar, Clock, Search, Copy, Check, Wand2, Loader2, X, ShieldCheck } from 'lucide-react';
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)

export const ContentArchive: React.FC = () => {
    const { contents } = useContentStore();
    const { user } = useAuthStore();
    const brand = useBrandStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContent, setSelectedContent] = useState<Content | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // [NEW] Admin Regeneration State
    const [regeneratedBody, setRegeneratedBody] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    const isAdmin = user?.role === 'admin';

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

    const handleRegenerate = async () => {
        if (!selectedContent || !isAdmin) return;

        setRegeneratedBody('');
        setIsRegenerating(true);

        try {
            const stream = geminiReasoningService.generateStream(selectedContent.title, {
                clinicName: brand.clinicName || '도담한의원',
                address: brand.address || '김포시 운양동',
                phoneNumber: brand.phoneNumber || '031-988-1575',
                profile: useProfileStore.getState() // [NEW] Pass profile context
            });

            let fullBody = '';
            for await (const chunk of stream) {
                fullBody += chunk;
                setRegeneratedBody(fullBody);
            }
        } catch (error) {
            console.error('Regeneration failed:', error);
            alert('재생성 중 오류가 발생했습니다.');
        } finally {
            setIsRegenerating(false);
        }
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

    // Reset regeneration when selection changes
    const selectContent = (content: Content) => {
        setSelectedContent(content);
        setRegeneratedBody(null);
    };

    return (
        <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-120px)] gap-6">
            {/* 리스트 영역 */}
            <div className={`w-full md:w-1/3 glass-card flex flex-col overflow-hidden ${selectedContent ? 'hidden md:flex' : 'flex'}`}>
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
                                onClick={() => selectContent(content)}
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
<<<<<<< HEAD
=======
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${content.riskCheckPassed ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                                        <ShieldCheck size={10} />
                                        {content.riskCheckPassed ? 'MEDICAL SAFE' : 'RISK DETECTED'}
                                    </span>
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
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
            <div className={`flex-1 glass-card flex flex-col overflow-hidden relative transition-all duration-500 ${selectedContent ? 'flex' : 'hidden md:flex'} ${regeneratedBody !== null ? 'max-w-none' : ''}`}>
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
<<<<<<< HEAD
=======
                                    <div className={`flex items-center gap-2 px-2 py-0.5 rounded text-[10px] font-black uppercase ${selectedContent.riskCheckPassed ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                                        <ShieldCheck size={12} />
                                        Medical Safety: {selectedContent.riskCheckPassed ? 'High' : 'Action Required'}
                                    </div>
>>>>>>> 0cca739 (feat: integrate detailed medical prompts and update content archive persistence)
                                    {isAdmin && (
                                        <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase">
                                            Admin View
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isAdmin && (
                                    <button
                                        onClick={handleRegenerate}
                                        disabled={isRegenerating}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-black transition-all text-sm font-bold border border-brand-primary/20 disabled:opacity-50"
                                    >
                                        {isRegenerating ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Wand2 size={16} />
                                        )}
                                        {regeneratedBody !== null ? '다시 재생성' : '새로 생성해서 비교'}
                                    </button>
                                )}
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
                                {regeneratedBody !== null && (
                                    <button
                                        onClick={() => setRegeneratedBody(null)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-gray-400"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedContent(null)}
                                    className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-gray-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className={`flex-1 flex overflow-hidden ${regeneratedBody !== null ? 'divide-x divide-white/10' : ''}`}>
                            {/* Original Content */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {regeneratedBody !== null && (
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                        Original Version (아카이브된 원본)
                                    </div>
                                )}
                                <div className="prose prose-invert max-w-none">
                                    <div className="whitespace-pre-wrap leading-relaxed text-gray-300">
                                        {selectedContent.body}
                                    </div>
                                </div>
                            </div>

                            {/* Regenerated Content (Comparison) */}
                            {regeneratedBody !== null && (
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-brand-primary/[0.02]">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                                            New Version (현재 설정으로 재생성)
                                        </div>
                                        {isRegenerating === false && (
                                            <button
                                                onClick={() => handleCopy(`${selectedContent.title}\n\n${regeneratedBody}`, 'regenerated')}
                                                className="text-[10px] font-bold text-gray-500 hover:text-brand-primary flex items-center gap-1"
                                            >
                                                {copiedId === 'regenerated' ? '복사됨' : '본문 복사'}
                                            </button>
                                        )}
                                    </div>
                                    <div className="prose prose-invert max-w-none">
                                        <div className="whitespace-pre-wrap leading-relaxed text-brand-primary/80">
                                            {regeneratedBody}
                                            {isRegenerating && (
                                                <span className="inline-block w-1.5 h-4 ml-1 bg-brand-primary animate-bounce shadow-neon" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
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
