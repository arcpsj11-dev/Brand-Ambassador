import React from 'react';
import { useSlotStore, type BlogSlot } from '../../store/useSlotStore';
import { ChevronDown, LayoutGrid, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SlotSelector: React.FC = () => {
    const { slots, activeSlotId, setActiveSlot } = useSlotStore();
    const [isOpen, setIsOpen] = React.useState(false);

    const activeSlot = slots.find((s: BlogSlot) => s.slotId === activeSlotId);

    if (slots.length === 0) return null;

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all ${activeSlot
                    ? 'bg-brand-primary/10 border-brand-primary/30 hover:bg-brand-primary/20'
                    : 'bg-red-500/10 border-red-500/30 animate-pulse'
                    }`}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeSlot ? 'bg-brand-primary/20 text-brand-primary' : 'bg-red-500/20 text-red-500'
                    }`}>
                    <LayoutGrid size={16} />
                </div>
                <div className="text-left">
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
                        {activeSlot ? 'Currently Posting To' : 'Action Required'}
                    </div>
                    <div className={`text-sm font-black flex items-center gap-2 ${activeSlot ? 'text-white' : 'text-red-500'}`}>
                        {activeSlot?.slotName || 'Select Active Blog'}
                        {activeSlot?.naverBlogId && (
                            <span className="text-[10px] font-medium text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                @{activeSlot.naverBlogId}
                            </span>
                        )}
                        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 mt-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-2 space-y-1">
                                {slots.map((slot: BlogSlot) => (
                                    <button
                                        key={slot.slotId}
                                        onClick={() => {
                                            setActiveSlot(slot.slotId);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeSlotId === slot.slotId
                                            ? 'bg-brand-primary/10 text-brand-primary'
                                            : 'hover:bg-white/5 text-gray-400'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${activeSlotId === slot.slotId ? 'bg-brand-primary animate-pulse' : 'bg-gray-600'
                                            }`} />
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-bold">{slot.slotName}</div>
                                                <div className="text-[10px] font-medium opacity-40">@{slot.naverBlogId}</div>
                                            </div>
                                            <div className="text-[10px] opacity-50">{slot.personaSetting.jobTitle} • {slot.currentCluster.currentIndex}/10</div>
                                        </div>
                                        {activeSlotId === slot.slotId && <Check size={14} />}
                                    </button>
                                ))}

                                {slots.length === 0 && (
                                    <div className="border-t border-white/5 mt-1 pt-1 p-3 text-center text-xs text-gray-500">
                                        No more slots available.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
