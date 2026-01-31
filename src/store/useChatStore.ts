import { create } from 'zustand';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatState {
    messages: Message[];
    isOpen: boolean;
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string; // ID 반환
    updateMessage: (id: string, content: string) => void;
    clearMessages: () => void;
    setIsOpen: (isOpen: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [
        {
            id: 'initial-greeting',
            role: 'assistant',
            content: '안녕하세요 원장님! 도담한의원 마케팅 비서 제니입니다. 무엇을 도와드릴까요? 💖',
            timestamp: Date.now(),
        },
    ],
    isOpen: false,
    addMessage: (message) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    ...message,
                    id,
                    timestamp: Date.now(),
                },
            ],
        }));
        return id;
    },
    updateMessage: (id, content) => set((state) => ({
        messages: state.messages.map(m => m.id === id ? { ...m, content } : m)
    })),
    clearMessages: () => set({ messages: [] }),
    setIsOpen: (isOpen) => set({ isOpen }),
}));
