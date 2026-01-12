import { create } from 'zustand';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatState {
    messages: Message[];
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [
        {
            id: '1',
            role: 'assistant',
            content: '안녕 원장님! 오늘은 어떤 힙한 전략을 짜볼까요? 궁금한 키워드나 블로그 공략법 물어봐주세요! 😎',
            timestamp: Date.now(),
        },
    ],
    addMessage: (message) => set((state) => ({
        messages: [
            ...state.messages,
            {
                ...message,
                id: Date.now().toString(),
                timestamp: Date.now(),
            },
        ],
    })),
    clearMessages: () => set({ messages: [] }),
}));
