import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/useChatStore';
import { geminiReasoningService, type ReasoningStep } from '../services/geminiService';
import { useBrandStore } from '../store/useBrandStore';
import { useKeywordStore, type KeywordGrade } from '../store/useKeywordStore';
import { useUIStore } from '../store/useUIStore';
import { usePlannerStore } from '../store/usePlannerStore';

// [Hybrid Component] 채팅 내 인라인 키워드 테이블
const InlineKeywordTable: React.FC<{ keywords: any[]; title: string }> = ({ keywords, title }) => (
    <div className="my-4 bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-brand-primary/10 px-4 py-2 border-b border-white/5 flex justify-between items-center">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{title}</span>
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
            </div>
        </div>
        <div className="p-2 overflow-x-auto">
            <table className="w-full text-[11px] text-left">
                <thead className="text-gray-500 uppercase font-black">
                    <tr>
                        <th className="p-2">Keyword</th>
                        <th className="p-2 text-right">Ratio</th>
                        <th className="p-2 text-right">Grade</th>
                    </tr>
                </thead>
                <tbody className="text-gray-200">
                    {keywords.slice(0, 5).map((k: any, i: number) => (
                        <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-2 font-bold">{k.term}</td>
                            <td className="p-2 text-right neon-text">{k.ratio}</td>
                            <td className="p-2 text-right">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${k.grade === '다이아' ? 'bg-cyan-500/20 text-cyan-400' :
                                    k.grade === '골드' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {k.grade}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const JennyChat: React.FC = () => {
    const [input, setInput] = useState('');
    const [isReasoning, setIsReasoning] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
    const [inlineKeywords, setInlineKeywords] = useState<any[] | null>(null);

    const brand = useBrandStore();
    const planner = usePlannerStore();
    const ui = useUIStore();
    const { addKeywords } = useKeywordStore();
    const { messages, addMessage, updateMessage, isOpen, setIsOpen } = useChatStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isReasoning, isStreaming]);

    // [나노바나나] 지수 기반 능동형 브리핑 시뮬레이션
    useEffect(() => {
        if (isOpen) {
            const lastBriefing = sessionStorage.getItem('last-briefing-index');
            if (lastBriefing !== String(brand.blogIndex)) {
                setTimeout(() => {
                    let recommendation = '';
                    if (brand.blogIndex < 30) recommendation = "[A-READ+] 전략을 추천드립니다. 이웃분들과의 따뜻한 공감대를 형성하기에 가장 좋은 시점이지요. ✨";
                    else if (brand.blogIndex < 70) recommendation = "[A-READ] 전략으로 전문성을 강조해 보시는 건 어떨까요? 원장님의 고집 있는 진료 철학을 보여줄 때입니다. 🦾";
                    else recommendation = "[PASONA] 전략으로 확신을 드릴 시기입니다. 환자분들께 명쾌한 해결책을 제시하여 신뢰를 높여보시지요. 📈";

                    addMessage({
                        role: 'assistant',
                        content: `원장님, 현재 블로그 지수는 ${brand.blogIndex}점입니다. 분석 결과, 지금은 ${recommendation}`
                    });
                    sessionStorage.setItem('last-briefing-index', String(brand.blogIndex));
                }, 1500);
            }
        }
    }, [isOpen, brand.blogIndex]);

    // [나노바나나] 탭 감지 능동형 인사
    useEffect(() => {
        if (isOpen) {
            const tabNames: Record<string, string> = {
                dashboard: '통계 대시보드',
                slots: '슬롯 관리자',
                archive: '콘텐츠 아카이브',
                diagnosis: '블로그 진단',
                admin: '관리자 센터',
                profile: '프로필 설정'
            };

            const currentTabName = tabNames[ui.activeTab] || '메인';
            let ment = `원장님, 지금 **${currentTabName}** 페이지를 보고 계시네요! 😉 필요한 게 있으시면 말씀만 하세요. 제가 직접 수정해 드릴 수도 있답니다!`;

            if (ui.activeTab === 'slots' && ui.contentMode === 'kitchen') {
                ment = "원장님, 이제 허리 환자들 다 끌어모을 '독한 글' 하나 제대로 만들어봐요! 😎 상식을 확 뒤엎는 오프닝부터 제니가 직접 세팅해 드릴게요! 🔥";
            }

            // 중복 메시지 방지 (간단하게 체크)
            if (messages.length > 0 && messages[messages.length - 1].content === ment) return;

            addMessage({ role: 'assistant', content: ment });
        }
    }, [ui.activeTab, ui.contentMode, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isStreaming || isReasoning) return;

        const userMsg = input.trim();
        addMessage({
            role: 'user',
            content: userMsg,
        });
        setInput('');
        setInlineKeywords(null);

        // [1] 의도 분석
        const intent = await geminiReasoningService.analyzeIntent(userMsg);

        if (intent === 'analysis') {
            setIsReasoning(true);
            setReasoningSteps([]);

            try {
                const response = await geminiReasoningService.analyzeKeywords(userMsg, {
                    city: brand.address?.split(' ')[2] || '김포'
                });

                // CoT 애니메이션
                for (const step of response.thoughtChain) {
                    setReasoningSteps((prev: ReasoningStep[]) => [...prev, { ...step, status: 'processing' as const }]);
                    await new Promise(r => setTimeout(r, 500));
                    setReasoningSteps((prev: ReasoningStep[]) => prev.map((s: ReasoningStep) => s.id === step.id ? { ...s, status: 'completed' as const } : s));
                }

                setIsReasoning(false);

                // 결과 UI 출력
                addMessage({
                    role: 'assistant',
                    content: response.briefing
                });

                // 키워드 데이터 스토어 저장 및 인라인 렌더링
                const newKeywords = response.keywords.map(term => {
                    const searchVolume = Math.floor(Math.random() * 8000) + 1000;
                    const documentCount = Math.floor(Math.random() * 5000) + 100;
                    const ratio = parseFloat((searchVolume / documentCount).toFixed(1));
                    const grade: KeywordGrade = ratio > 1.0 ? '다이아' : ratio > 0.5 ? '골드' : '실버';
                    return { id: Math.random().toString(36).substr(2, 9), term, searchVolume, documentCount, ratio, grade, isDeleted: false };
                });

                addKeywords(newKeywords);
                setInlineKeywords(newKeywords);

                // 대시보드로도 신호 전송
                window.dispatchEvent(new CustomEvent('trigger-scout', { detail: { query: userMsg } }));

            } catch (error) {
                setIsReasoning(false);
                addMessage({ role: 'assistant', content: '죄송해요 원장님, 분석 중에 제니가 깜빡 졸았나 봐요! 💦 다시 한번 말씀해주시면 눈 번쩍 뜨고 분석할게요!' });
            }
        } else if (intent === 'action') {
            // [중앙 제어] 데이터 대리 수정
            const actionResult = await geminiReasoningService.generateAction(userMsg, { brand, planner });

            if (actionResult.type === 'UPDATE_BRAND') {
                brand.setBrand(actionResult.payload);
            } else if (actionResult.type === 'UPDATE_PLANNER') {
                const { day, topic } = actionResult.payload;
                const newPlan = planner.monthlyPlan.map(p => p.day === day ? { ...p, topic, status: 'ready' as const } : p);
                planner.setMonthlyPlan(newPlan);
            }

            addMessage({ role: 'assistant', content: actionResult.response });

        } else if (intent === 'planner') {
            // 플래너 로직 (추후 확장)
            addMessage({ role: 'assistant', content: '원장님! 한 달 마케팅 로드맵이 궁금하시군요? 좌측 [콘텐츠 플래너] 탭을 확인해 보세요. 제가 완벽한 스케줄을 짜두었답니다! ✨' });
        } else {
            // [대화 모드] 실시간 스트리밍
            setIsStreaming(true);
            const assistantMsgId = addMessage({
                role: 'assistant',
                content: '',
            });

            let fullContent = '';
            const stream = geminiReasoningService.generateStream(userMsg, {
                clinicName: brand.clinicName || '나노바나나',
                address: brand.address || '김포시 운양동',
                phoneNumber: brand.phoneNumber || '010-0000-0000',
                blogIndex: brand.blogIndex
            });

            for await (const chunk of stream) {
                fullContent += chunk;
                updateMessage(assistantMsgId, fullContent);
            }
            setIsStreaming(false);
        }
    };

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center shadow-neon z-[100] border-4 border-black group"
            >
                <div className="relative">
                    <TrendingUp className="text-black group-hover:rotate-12 transition-transform" size={28} />
                    {isStreaming && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                        </span>
                    )}
                </div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9, rotate: -2 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9, rotate: 2 }}
                        className="fixed bottom-24 right-6 w-96 h-[600px] glass-card flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] z-[100] border-brand-primary/20 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-brand-primary/20 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-neon">
                                    <Bot className="text-black" size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-black text-sm tracking-tighter italic">JENNY AI 2.0</h3>
                                    <p className="text-[10px] text-brand-primary font-black uppercase flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Strategic Brain
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-6 font-inter no-scrollbar bg-black/30">
                            {messages.map((msg) => (
                                <motion.div key={msg.id} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className="max-w-[85%] space-y-2">
                                        <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-brand-primary/10 border border-brand-primary/30 text-white rounded-tr-none'
                                            : 'bg-white/5 border border-white/10 text-gray-200 italic rounded-tl-none font-medium'
                                            }`}>
                                            {msg.content || '...'}
                                        </div>
                                        {msg.role === 'assistant' && msg.id === messages[messages.length - 1].id && inlineKeywords && (
                                            <InlineKeywordTable keywords={inlineKeywords} title="Strategic Insight Table" />
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* [AI Reasoning UI Indicator] */}
                            {isReasoning && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="max-w-[85%] w-full p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/30 space-y-3 border-dashed">
                                        <div className="flex items-center gap-2 text-brand-primary animate-pulse">
                                            <TrendingUp size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Jenny Deep Reasoning...</span>
                                        </div>
                                        <div className="space-y-2">
                                            {reasoningSteps.map((step) => (
                                                <div key={step.id} className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${step.status === 'completed' ? 'bg-brand-primary shadow-neon' : 'bg-white/10 animate-pulse'}`} />
                                                    <span className="text-[10px] text-gray-500">{step.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-5 border-t border-white/10 bg-black/60 backdrop-blur-xl">
                            <div className="flex gap-2 relative">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={isStreaming ? "제니가 입력 중..." : "원장님, 어떤 전략을 짜드릴까요? 💖"}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-brand-primary/50 text-sm transition-all focus:shadow-neon-sm pr-14"
                                    disabled={isReasoning || isStreaming}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isReasoning || isStreaming || !input.trim()}
                                    className="absolute right-2 top-2 bottom-2 bg-brand-primary text-black w-12 rounded-xl hover:shadow-neon transition-all disabled:opacity-20 flex items-center justify-center"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                <button onClick={() => setInput("이번 달 블로그 시나리오 짜줘")} className="flex-shrink-0 text-[9px] font-black text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5 hover:border-brand-primary/30 hover:text-brand-primary transition-all">📅 한 달 달력</button>
                                <button onClick={() => setInput("비염 환자 늘리는 키워드 분석해줘")} className="flex-shrink-0 text-[9px] font-black text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5 hover:border-brand-primary/30 hover:text-brand-primary transition-all">💎 비염 분석</button>
                                <button onClick={() => setInput("안녕 제니야, 오늘 기분 어때?")} className="flex-shrink-0 text-[9px] font-black text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/5 hover:border-brand-primary/30 hover:text-brand-primary transition-all">💖 제니랑 수다</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
