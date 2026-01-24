import React, { useState } from 'react';
import { useSlotStore, type BlogSlot } from '../../store/useSlotStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useAdminStore } from '../../store/useAdminStore';
import {
    Plus,
    Settings2,
    Trash2,
    LayoutGrid,
    CheckCircle2,
    X,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopicClusterGenerator } from './TopicClusterGenerator';
import { SlotContentFlow } from './SlotContentFlow';

// PERSONA_TEMPLATES removed in favor of dynamic admin store occupations

export const SlotManager: React.FC = () => {
    const { slots, activeSlotId, setActiveSlot, createSlot, updateSlot, deleteSlot, canCreateSlot, getMaxSlots } = useSlotStore();
    const { user } = useAuthStore();
    const { occupations } = useAdminStore();
    const occupationList = Object.values(occupations);
    const [isEditing, setIsEditing] = useState(false);
    const [editingSlot, setEditingSlot] = useState<Partial<BlogSlot> | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'strategy'>('basic');
    const [contentFlowSlotId, setContentFlowSlotId] = useState<string | null>(null);

    const userTier = user?.tier || 'BASIC';
    const tier = userTier;
    const maxSlots = getMaxSlots(tier);

    const handleCreateNew = () => {
        if (!canCreateSlot(tier)) {
            alert(`${tier} 등급은 최대 ${maxSlots}개 슬롯까지만 이용 가능합니다. 상위 플랜으로 업그레이드하세요!`);
            return;
        }
        setEditingSlot({
            slotName: '',
            naverBlogId: '',
            occupationId: 'doctor', // Default
            personaSetting: {
                jobTitle: '한의사',
                toneAndManner: '신뢰감 있는',
                expertise: []
            }
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!editingSlot?.slotName || !editingSlot?.naverBlogId) {
            alert('필수 정보를 모두 입력해주세요.');
            return;
        }

        if (editingSlot.slotId) {
            updateSlot(editingSlot.slotId, editingSlot);
        } else {
            createSlot(editingSlot);
        }
        setIsEditing(false);
        setEditingSlot(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white italic tracking-tight">SLOT MANAGEMENT</h2>
                    <p className="text-sm text-gray-500">현재 이용 가능한 슬롯: {slots.length} / {maxSlots}</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-black font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-neon-sm"
                >
                    <Plus size={16} />
                    New Slot
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slots.map((slot) => (
                    <motion.div
                        key={slot.slotId}
                        layoutId={slot.slotId}
                        onClick={() => setActiveSlot(slot.slotId)}
                        className={`glass-card p-6 border-white/5 transition-all group cursor-pointer relative overflow-hidden ${activeSlotId === slot.slotId
                            ? 'border-brand-primary/40 bg-brand-primary/5 ring-1 ring-brand-primary/20'
                            : 'bg-white/[0.02] hover:bg-white/[0.05]'
                            }`}
                    >
                        {activeSlotId === slot.slotId && (
                            <div className="absolute top-0 right-0 bg-brand-primary text-black text-[8px] font-black px-3 py-1 uppercase tracking-tighter rounded-bl-lg shadow-neon flex items-center gap-1">
                                <CheckCircle2 size={10} /> Active Now
                            </div>
                        )}

                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${activeSlotId === slot.slotId ? 'bg-brand-primary text-black shadow-neon' : 'bg-brand-primary/10 text-brand-primary'
                                }`}>
                                <LayoutGrid size={24} />
                            </div>
                            <div className="flex items-center gap-1 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSlot(slot);
                                        setIsEditing(true);
                                    }}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <Settings2 size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('슬롯을 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) {
                                            deleteSlot(slot.slotId);
                                        }
                                    }}
                                    className="p-2 text-red-500/50 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">{slot.slotName}</h3>
                        <p className="text-xs text-brand-primary font-black uppercase tracking-tighter mb-4">{slot.naverBlogId}</p>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <CheckCircle2 size={12} className="text-brand-primary" />
                                <span>페르소나: {slot.personaSetting.jobTitle}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <CheckCircle2 size={12} className="text-brand-primary" />
                                <span>톤앤매너: {slot.personaSetting.toneAndManner}</span>
                            </div>
                        </div>

                        <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(slot.currentCluster.currentIndex / 10) * 100}%` }}
                                className="absolute inset-y-0 left-0 bg-brand-primary shadow-neon-sm"
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">
                            <span>Progress</span>
                            <span>{slot.currentCluster.currentIndex} / {1 + (slot.currentCluster.satelliteTitles?.length || 9)}</span>
                        </div>

                        <div className="flex gap-2">

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSlot(slot);
                                    setActiveTab('strategy');
                                    setIsEditing(true);
                                }}
                                className="flex-1 py-2 rounded-lg border border-brand-primary/20 text-brand-primary font-black uppercase text-[10px] tracking-widest hover:bg-brand-primary/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Sparkles size={12} /> Manage Topics
                            </button>
                        </div>
                    </motion.div>
                ))}

                {slots.length < maxSlots && (
                    <button
                        onClick={handleCreateNew}
                        className="border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 text-gray-500 hover:text-brand-primary hover:border-brand-primary/20 hover:bg-brand-primary/5 transition-all"
                    >
                        <Plus size={32} />
                        <span className="text-sm font-bold uppercase tracking-widest">Add New Slot</span>
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsEditing(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-4xl glass-card border-white/10 bg-[#121212] p-5 lg:p-8 overflow-y-auto max-h-[95vh] lg:max-h-[90vh] shadow-2xl custom-scrollbar"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-bold text-white italic">
                                    {editingSlot?.slotId ? 'EDIT BLOG SLOT' : 'CREATE NEW SLOT'}
                                </h3>
                                <button onClick={() => { setIsEditing(false); setActiveTab('basic'); }} className="text-gray-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tabs (Only for existing slots) */}
                            {editingSlot?.slotId && (
                                <div className="flex border-b border-white/5 mb-6">
                                    <button
                                        onClick={() => setActiveTab('basic')}
                                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'basic' ? 'text-brand-primary' : 'text-gray-500'}`}
                                    >
                                        Basic Info
                                        {activeTab === 'basic' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary shadow-neon-sm" />}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('strategy')}
                                        className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'strategy' ? 'text-brand-primary' : 'text-gray-500'}`}
                                    >
                                        Topic Strategy
                                        {activeTab === 'strategy' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary shadow-neon-sm" />}
                                    </button>
                                </div>
                            )}

                            <div className="space-y-6">
                                {activeTab === 'basic' ? (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Slot Name</label>
                                            <input
                                                type="text"
                                                value={editingSlot?.slotName}
                                                onChange={(e) => setEditingSlot({ ...editingSlot, slotName: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/30 transition-all font-bold"
                                                placeholder="예: 교통사고 다이어트 블로그"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Naver Blog ID</label>
                                            <input
                                                type="text"
                                                value={editingSlot?.naverBlogId}
                                                onChange={(e) => setEditingSlot({ ...editingSlot, naverBlogId: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-primary/30 transition-all font-bold"
                                                placeholder="네이버 ID 입력"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Occupation (Prompt Strategy)</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {occupationList.map((occ) => (
                                                    <button
                                                        key={occ.id}
                                                        onClick={() => {
                                                            setEditingSlot({
                                                                ...editingSlot,
                                                                occupationId: occ.id,
                                                                personaSetting: {
                                                                    jobTitle: occ.label,
                                                                    toneAndManner: '신뢰감 있는', // Default tone or derived
                                                                    expertise: []
                                                                }
                                                            });
                                                        }}
                                                        className={`p-3 rounded-xl border transition-all text-left ${editingSlot?.occupationId === occ.id
                                                            ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                            }`}
                                                    >
                                                        <div className="text-sm font-bold">{occ.label}</div>
                                                        <div className="text-[9px] opacity-60 leading-tight mt-1">Prompt Applied</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <button
                                                onClick={() => { setIsEditing(false); setActiveTab('basic'); }}
                                                className="flex-1 py-4 rounded-xl border border-white/10 text-gray-500 font-bold hover:bg-white/5 transition-all uppercase text-xs tracking-widest"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="flex-1 py-4 rounded-xl bg-brand-primary text-black font-black hover:scale-[1.02] transition-all uppercase text-xs tracking-widest shadow-neon-sm"
                                            >
                                                Save Basic Info
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {editingSlot?.occupationId && (
                                            <div className="mb-4 p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-black">
                                                    <CheckCircle2 size={12} />
                                                </div>
                                                <p className="text-xs text-brand-primary font-bold">
                                                    선택한 직업({occupationList.find(o => o.id === editingSlot.occupationId)?.label || editingSlot.occupationId})에 맞는 프롬프트가 적용되었습니다.
                                                </p>
                                            </div>
                                        )}
                                        <TopicClusterGenerator
                                            key={editingSlot?.slotId} // Force re-render on slot change
                                            slotId={editingSlot?.slotId || ''}
                                            onComplete={() => { setIsEditing(false); setActiveTab('basic'); }}
                                        />
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SlotContentFlow Modal */}
            <AnimatePresence>
                {contentFlowSlotId && (
                    <SlotContentFlow
                        slotId={contentFlowSlotId}
                        onComplete={() => setContentFlowSlotId(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
