import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Sparkles, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/useChatStore';

export const JennyChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const { messages, addMessage } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        addMessage({
            role: 'user',
            content: input,
        });
        setInput('');

        // 제니 응답 시뮬레이션 (수동 채팅 시에만 적용)
        setTimeout(() => {
            addMessage({
                role: 'assistant',
                content: `오, "${input}" 주제 폼 미쳤는데요? 제 생각엔 이걸로 블로그 쓰면 다이아 등급 노출 무조건 가능할 것 같아요! 구체적인 스토리보드 짜드릴까요? 🔥`,
            });
        }, 1000);
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center shadow-neon z-[100]"
            >
                <MessageSquare className="text-black" size={24} />
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-96 h-[500px] glass-card flex flex-col shadow-2xl z-[100] border-brand-primary/20"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-brand-primary/10 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shadow-neon">
                                    <Sparkles className="text-black" size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">제니 (Jenny)</h3>
                                    <p className="text-[10px] text-brand-primary/70">실시간 전략 설계 중...</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans no-scrollbar">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                            ? 'bg-brand-primary/20 border border-brand-primary/20 text-white'
                                            : 'bg-white/5 border border-white/10 text-gray-200 italic'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-bold uppercase">
                                            {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                                            {msg.role === 'user' ? 'You' : 'Jenny'}
                                        </div>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="메시지를 입력하세요..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-brand-primary/50 text-sm transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    className="bg-brand-primary text-black p-2 rounded-xl hover:shadow-neon transition-all"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
