import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Briefcase } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';

interface OccupationSelectorProps {
    className?: string;
    variant?: 'default' | 'minimal';
}

export const OccupationSelector: React.FC<OccupationSelectorProps> = ({ className = '', variant = 'default' }) => {
    const { occupations, activeOccupationId, setActiveOccupation } = useAdminStore();
    const [isOpen, setIsOpen] = useState(false);

    const activeOccupation = occupations[activeOccupationId] || Object.values(occupations)[0];
    const occupationList = Object.values(occupations);

    const handleSelect = (id: string) => {
        setActiveOccupation(id);
        setIsOpen(false);
    };

    if (variant === 'minimal') {
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                >
                    <Briefcase size={14} />
                    <span>{activeOccupation?.label || 'Occupation'}</span>
                    <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute right-0 top-full mt-2 w-32 bg-black/90 border border-white/10 rounded-lg shadow-xl backdrop-blur-md overflow-hidden z-50"
                        >
                            {occupationList.map((occ) => (
                                <button
                                    key={occ.id}
                                    onClick={() => handleSelect(occ.id)}
                                    className={`w-full text-left px-4 py-3 text-xs font-bold ${activeOccupationId === occ.id ? 'text-brand-primary bg-white/5' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {occ.label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Default Luxurious Variant
    const [newOccupationLabel, setNewOccupationLabel] = useState("");
    const { addOccupation } = useAdminStore();

    const handleAddOccupation = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (newOccupationLabel.trim()) {
            const id = newOccupationLabel.trim().toLowerCase().replace(/\s+/g, '_');
            addOccupation(id, newOccupationLabel.trim());
            setNewOccupationLabel("");
            setActiveOccupation(id);
            setIsOpen(false);
        }
    };

    return (
        <div className={`relative z-50 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-brand-primary/50 transition-all group"
            >
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                    <Briefcase size={16} />
                </div>
                <div className="text-left">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Occupation</p>
                    <p className="text-sm font-bold text-white leading-none flex items-center gap-2">
                        {activeOccupation?.label}
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </p>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1c] border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden"
                    >
                        <div className="p-2 space-y-1">
                            {occupationList.map((occ) => (
                                <button
                                    key={occ.id}
                                    onClick={() => handleSelect(occ.id)}
                                    className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all ${activeOccupationId === occ.id
                                        ? 'bg-brand-primary text-black font-bold shadow-neon'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className="text-sm">{occ.label}</span>
                                    {activeOccupationId === occ.id && <div className="w-2 h-2 rounded-full bg-black animate-pulse" />}
                                </button>
                            ))}
                        </div>

                        {/* Add New Occupation */}
                        <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newOccupationLabel}
                                    onChange={(e) => setNewOccupationLabel(e.target.value)}
                                    placeholder="새 직업군 추가..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-primary/50"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                    onClick={handleAddOccupation}
                                    className="bg-brand-primary text-black text-xs font-bold px-2 rounded-lg hover:shadow-neon transition-all"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
