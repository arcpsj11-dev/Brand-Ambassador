import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BrandState {
    clinicName: string;
    phoneNumber: string;
    address: string;
    subjects: string;
    philosophy: string;
    blogUrl: string;
    isSet: boolean;
    setBrand: (brand: Partial<BrandState>) => void;
}

export const useBrandStore = create<BrandState>()(
    persist(
        (set) => ({
            clinicName: '',
            phoneNumber: '',
            address: '',
            subjects: '',
            philosophy: '',
            blogUrl: '',
            isSet: false,
            setBrand: (brand) => set((state) => ({ ...state, ...brand, isSet: true })),
        }),
        {
            name: 'jenny-brand-storage',
        }
    )
);
