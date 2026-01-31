import React, { useState } from 'react';
import { Wand2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { imageService } from '../../services/imageService';

export const ImageTester: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('프롬프트를 입력해주세요');
            return;
        }

        setLoading(true);
        setError('');
        setImageUrl('');

        try {
            console.log('[ImageTester] Generating image with prompt:', prompt);
            const url = await imageService.generateImage(prompt);
            console.log('[ImageTester] Image generated:', url);
            setImageUrl(url);
        } catch (err: any) {
            console.error('[ImageTester] Error:', err);
            setError(err.message || '이미지 생성 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center">
                            <ImageIcon size={24} className="text-black" />
                        </div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                            Image Generator Test
                        </h1>
                    </div>
                    <p className="text-gray-500 font-medium">
                        이미지 생성 API를 빠르게 테스트하세요
                    </p>
                </div>

                {/* Input Section */}
                <div className="glass-card p-8 border-white/10 space-y-6">
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">
                            Image Prompt (영어로 입력)
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="예: A professional medical clinic interior with modern equipment"
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-brand-primary transition-all resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    handleGenerate();
                                }
                            }}
                        />
                        <p className="text-xs text-gray-600">
                            Ctrl + Enter로 빠르게 생성
                        </p>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="w-full py-4 rounded-xl bg-brand-primary text-black font-black uppercase text-sm tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-neon-sm"
                    >
                        {loading ? (
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
                </div>

                {/* Error Display */}
                {error && (
                    <div className="glass-card p-6 border-red-500/20 bg-red-500/10">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="font-bold text-red-500 mb-1">오류 발생</h3>
                                <p className="text-sm text-gray-400">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Display */}
                {imageUrl && (
                    <div className="glass-card p-8 border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-brand-primary uppercase tracking-widest">
                                생성된 이미지
                            </h3>
                            <a
                                href={imageUrl}
                                download="generated-image.png"
                                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-bold transition-all"
                            >
                                다운로드
                            </a>
                        </div>
                        <div className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10">
                            <img
                                src={imageUrl}
                                alt={prompt}
                                className="w-full h-auto"
                                onError={() => {
                                    console.error('[ImageTester] Image load error');
                                    setError('이미지 로드 실패');
                                }}
                            />
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                            {imageUrl.substring(0, 100)}...
                        </div>
                    </div>
                )}

                {/* Quick Examples */}
                <div className="glass-card p-6 border-white/10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                        빠른 예제
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            'A modern medical clinic reception desk',
                            'Professional doctor in white coat',
                            'Clean hospital treatment room',
                            'Medical equipment on a table'
                        ].map((example, idx) => (
                            <button
                                key={idx}
                                onClick={() => setPrompt(example)}
                                className="text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-all border border-white/5 hover:border-brand-primary/30"
                            >
                                {example}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
