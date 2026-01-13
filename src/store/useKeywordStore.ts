import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type KeywordGrade = '다이아' | '골드' | '실버' | '브론즈';

export interface Keyword {
    id: string;
    term: string;
    searchVolume: number;
    documentCount: number;
    ratio: number;
    grade: KeywordGrade;
    isDeleted: boolean;
    deletedAt?: number;
}

interface KeywordState {
    keywords: Keyword[];
    addKeywords: (newKeywords: Keyword[]) => void;
    deleteKeyword: (id: string) => void;
    deleteKeywords: (ids: string[]) => void;
    restoreKeyword: (id: string) => void;
    clearActiveKeywords: () => void;
    permanentlyDelete: () => void;
}

export const useKeywordStore = create<KeywordState>()(
    persist(
        (set) => ({
            keywords: [],
            addKeywords: (newKeywords) =>
                set((state) => ({
                    keywords: [...newKeywords, ...state.keywords]
                })),
            deleteKeyword: (id) =>
                set((state) => ({
                    keywords: state.keywords.map((k) =>
                        k.id === id ? { ...k, isDeleted: true, deletedAt: Date.now() } : k
                    ),
                })),
            deleteKeywords: (ids) =>
                set((state) => ({
                    keywords: state.keywords.map((k) =>
                        ids.includes(k.id) ? { ...k, isDeleted: true, deletedAt: Date.now() } : k
                    ),
                })),
            restoreKeyword: (id) =>
                set((state) => ({
                    keywords: state.keywords.map((k) =>
                        k.id === id ? { ...k, isDeleted: false, deletedAt: undefined } : k
                    ),
                })),
            clearActiveKeywords: () =>
                set((state) => ({
                    keywords: state.keywords.map((k) =>
                        !k.isDeleted ? { ...k, isDeleted: true, deletedAt: Date.now() } : k
                    ),
                })),
            permanentlyDelete: () =>
                set((state) => ({
                    keywords: state.keywords.filter(
                        (k) => !k.isDeleted || (k.deletedAt && Date.now() - k.deletedAt < 3 * 24 * 60 * 60 * 1000)
                    ),
                })),
        }),
        {
            name: 'jenny-keyword-storage',
        }
    )
);
