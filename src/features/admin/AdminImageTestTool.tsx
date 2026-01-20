import React, { useState } from 'react';
import { Wand2, Image as ImageIcon, Download, Copy } from 'lucide-react';
import { imageService } from '../../services/imageService';

export const AdminImageTestTool: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [subject, setSubject] = useState('');
    const [style, setStyle] = useState('professional medical photography');
    const [generatedImage, setGeneratedImage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const quickTemplates = [
        { name: '한의원 내부', prompt: 'Modern Korean medicine clinic interior with clean design and natural lighting' },
        { name: '진료실', prompt: 'Professional medical consultation room with doctor desk and patient chair' },
        { name: '대기실', prompt: 'Comfortable medical clinic waiting room with modern furniture' },
        { name: '한약', prompt: 'Traditional Korean herbal medicine ingredients in wooden drawers' },
    ];

    const handleGenerate = async () => {
        if (!prompt.trim() && !subject.trim()) {
            setError('프롬프트 또는 주제를 입력해주세요');
            return;
        }

        setIsGenerating(true);
        setError('');
        setGeneratedImage('');

        try {
            const fullPrompt = prompt.trim() || `${subject}, ${style}`;
            console.log('[AdminImageTest] Generating with prompt:', fullPrompt);

            const url = await imageService.generateImage(fullPrompt);
            setGeneratedImage(url);
        } catch (err: any) {
            console.error('[AdminImageTest] Error:', err);
            setError(err.message || '이미지 생성 실패');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;

        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `generated-${Date.now()}.png`;
        link.click();
    };

    const handleCopyPrompt = () => {
        const fullPrompt = prompt.trim() || `${subject}, ${style}`;
        navigator.clipboard.writeText(fullPrompt);
        alert('프롬프트가 복사되었습니다');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                <ImageIcon size={20} />
                <span className="font-bold text-sm uppercase tracking-widest">Image Generation Test Tool</span>
            </div>

            {/* Quick Templates */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">빠른 템플릿</label>
                <div className="grid grid-cols-2 gap-2">
                    {quickTemplates.map((template, idx) => (
                        <button
                            key={idx}
                            onClick={() => setPrompt(template.prompt)}
                            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-primary/30 text-left transition-all"
                        >
                            <div className="text-xs font-bold text-brand-primary">{template.name}</div>
                            <div className="text-[10px] text-gray-500 mt-1 truncate">{template.prompt}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Method 1: Full Prompt */}
            <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    방법 1: 전체 프롬프트 (영어)
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="예: A modern medical clinic interior with clean white walls and natural lighting"
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-brand-primary outline-none transition-all resize-none"
                />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10"></div>
                <span className="text-xs text-gray-600 font-bold">또는</span>
                <div className="h-px flex-1 bg-white/10"></div>
            </div>

            {/* Input Method 2: Subject + Style */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">주제</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="예: clinic interior"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-primary outline-none transition-all"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">스타일</label>
                    <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-brand-primary outline-none transition-all"
                    >
                        <option value="professional medical photography">Professional Medical</option>
                        <option value="modern minimalist design">Modern Minimalist</option>
                        <option value="warm and welcoming atmosphere">Warm & Welcoming</option>
                        <option value="traditional Korean medicine style">Traditional Korean</option>
                    </select>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || (!prompt.trim() && !subject.trim())}
                    className="flex-1 py-4 rounded-xl bg-brand-primary text-black font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            생성 중...
                        </>
                    ) : (
                        <>
                            <Wand2 size={20} />
                            이미지 생성
                        </>
                    )}
                </button>
                <button
                    onClick={handleCopyPrompt}
                    disabled={!prompt.trim() && !subject.trim()}
                    className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all disabled:opacity-50"
                >
                    <Copy size={18} />
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {error}
                </div>
            )}

            {/* Generated Image Display */}
            {generatedImage && (
                <div className="space-y-4 p-6 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-brand-primary uppercase tracking-widest">생성된 이미지</span>
                        <button
                            onClick={handleDownload}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-brand-primary hover:text-black text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <Download size={14} />
                            다운로드
                        </button>
                    </div>
                    <div className="relative rounded-xl overflow-hidden border border-white/20">
                        <img
                            src={generatedImage}
                            alt="Generated"
                            className="w-full h-auto"
                        />
                    </div>
                    <div className="text-xs text-gray-600 font-mono break-all bg-black/20 p-3 rounded-lg">
                        {generatedImage.substring(0, 100)}...
                    </div>
                </div>
            )}
        </div>
    );
};
