import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BrandState {
    clinicName: string;
    phoneNumber: string;
    address: string;
    subjects: string;
    philosophy: string;
    equipment: string;
    facilities: string;
    blogUrl: string;
    blogIndex: number; // 0-100
    indicators: {
        visitors: number;
        stayTime: number; // seconds
        rankingScore: number;
    };
    isSet: boolean;
    setBrand: (brand: Partial<BrandState>) => void;
    updateIndex: (score: number) => void;
}

export const useBrandStore = create<BrandState>()(
    persist(
        (set) => ({
            clinicName: '',
            phoneNumber: '',
            address: '',
            subjects: '',
            philosophy: '',
            equipment: '',
            facilities: '',
            blogUrl: '',
            blogIndex: 45, // 초기 시뮬레이션 값
            indicators: {
                visitors: 120,
                stayTime: 45,
                rankingScore: 68,
            },
            isSet: false,
            setBrand: (brand) => set((state) => ({ ...state, ...brand, isSet: true })),
            updateIndex: (score) => set({ blogIndex: score }),
        }),
        {
            name: 'jenny-brand-storage',
        }
    )
);
