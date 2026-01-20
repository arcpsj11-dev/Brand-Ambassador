import React, { useState, useEffect } from 'react';
import {
    Settings,
    Users,
    Wand2,
    Key,
    Save,
    ShieldCheck,
    User,
    MessageSquare,
    Image as ImageIcon,
    FileText,
    Type
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminStore } from '../../store/useAdminStore';
import { OccupationSelector } from './OccupationSelector';
import { AdminImageTestTool } from './AdminImageTestTool';

export const AdminDashboard: React.FC = () => {
    const adminState = useAdminStore();
    const {
        geminiApiKey, setGeminiApiKey,
        activeOccupationId, occupations,
        updateOccupationPrompt,
        users, updateUserTier
    } = adminState;

    const [activeTab, setActiveTab] = useState<'prompts' | 'users' | 'settings' | 'image-test'>('prompts');
    const [localPrompts, setLocalPrompts] = useState(occupations[activeOccupationId]?.prompts);
    const [localApiKey, setLocalApiKey] = useState(geminiApiKey);

    // Sync local prompts when active occupation changes
    useEffect(() => {
        if (occupations[activeOccupationId]) {
            setLocalPrompts(occupations[activeOccupationId].prompts);
        }
    }, [activeOccupationId, occupations]);

    const handleSavePrompts = () => {
        if (!localPrompts) return;
        updateOccupationPrompt(activeOccupationId, 'title', localPrompts.title);
        updateOccupationPrompt(activeOccupationId, 'body', localPrompts.body);
        updateOccupationPrompt(activeOccupationId, 'image', localPrompts.image);
        updateOccupationPrompt(activeOccupationId, 'chat', localPrompts.chat);
        alert('프롬프트 설정이 저장되었습니다.');
    };

    const handleSaveSettings = () => {
        setGeminiApiKey(localApiKey);
        alert('API 설정이 저장되었습니다.');
    };

    return (
        <div className="flex h-screen bg-[#0A0A0B] text-white">
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 bg-black p-6 flex flex-col gap-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
                        <ShieldCheck size={20} className="text-black" />
                    </div>
                    <span className="font-black tracking-tighter text-xl italic uppercase">Admin Panel</span>
                </div>

                <nav className="flex flex-col gap-2">
                    <button
                        onClick={() => setActiveTab('prompts')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'prompts' ? 'bg-brand-primary text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Wand2 size={18} />
                        <span>프롬프트 제어</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-brand-primary text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Users size={18} />
                        <span>회원 등급 조정</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-brand-primary text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <Settings size={18} />
                        <span>글로벌 설정</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('image-test')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'image-test' ? 'bg-brand-primary text-black font-bold' : 'text-gray-400 hover:bg-white/5'}`}
                    >
                        <ImageIcon size={18} />
                        <span>이미지 테스트</span>
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-12">

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                                {activeTab === 'prompts' && 'Prompt Control'}
                                {activeTab === 'users' && 'User Management'}
                                {activeTab === 'settings' && 'Global Settings'}
                                {activeTab === 'image-test' && 'Image Test Tool'}
                            </h1>
                            <p className="text-gray-500 font-medium">
                                {activeTab === 'prompts' && '직업별 AI 생성 로직의 핵심 프롬프트를 실시간으로 제어합니다.'}
                                {activeTab === 'users' && '회원의 권한 및 멤버십 등급을 수동으로 조정합니다.'}
                                {activeTab === 'settings' && '시스템 전반에 적용되는 API 키 및 기본 타겟을 설정합니다.'}
                                {activeTab === 'image-test' && '프롬프트를 입력하여 이미지 생성 API를 즉시 테스트합니다.'}
                            </p>
                        </div>

                        {/* Occupation Selector in Header for Prompt Tab */}
                        {activeTab === 'prompts' && <OccupationSelector />}
                    </div>

                    {/* Prompts Tab */}
                    {activeTab === 'prompts' && localPrompts && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* Title Prompt */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <Type size={14} className="text-brand-primary" />
                                        Monthly Titles (30일 주제)
                                    </label>
                                    <textarea
                                        value={localPrompts.title}
                                        onChange={(e) => setLocalPrompts(prev => ({ ...prev!, title: e.target.value }))}
                                        className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-sm focus:border-brand-primary outline-none transition-all resize-none"
                                        placeholder="{{topic}} 플레이스홀더를 포함하세요."
                                    />
                                </div>

                                {/* Image Prompt */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <ImageIcon size={14} className="text-brand-primary" />
                                        Image Analysis (이미지 추출)
                                    </label>
                                    <textarea
                                        value={localPrompts.image}
                                        onChange={(e) => setLocalPrompts(prev => ({ ...prev!, image: e.target.value }))}
                                        className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-sm focus:border-brand-primary outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Chat Prompt */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <MessageSquare size={14} className="text-brand-primary" />
                                        Chat Persona (채팅 페르소나)
                                    </label>
                                    <textarea
                                        value={localPrompts.chat}
                                        onChange={(e) => setLocalPrompts(prev => ({ ...prev!, chat: e.target.value }))}
                                        className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-sm focus:border-brand-primary outline-none transition-all resize-none"
                                    />
                                </div>

                                {/* Body Prompt (Full Width) */}
                                <div className="space-y-3 xl:col-span-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                        <FileText size={14} className="text-brand-primary" />
                                        Main Content (본문 생성)
                                    </label>
                                    <textarea
                                        value={localPrompts.body}
                                        onChange={(e) => setLocalPrompts(prev => ({ ...prev!, body: e.target.value }))}
                                        className="w-full h-96 bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-sm focus:border-brand-primary outline-none transition-all resize-none"
                                        placeholder="{{title}}, {{persona}}, {{tone}} 플레이스홀더를 포함하세요."
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-white/5">
                                <button
                                    onClick={handleSavePrompts}
                                    className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-black font-black uppercase tracking-widest rounded-xl hover:shadow-neon transition-all"
                                >
                                    <Save size={20} />
                                    <span>프롬프트 설정 저장</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden text-sm">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-bold uppercase tracking-widest">
                                            <th className="px-8 py-4 text-left">회원 아이디</th>
                                            <th className="px-8 py-4 text-left">역할</th>
                                            <th className="px-8 py-4 text-left">등급/기한</th>
                                            <th className="px-8 py-4 text-left">자동조절</th>
                                            <th className="px-8 py-4 text-right">조정</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((user) => {
                                            const isExpired = user.expiresAt && new Date() > new Date(user.expiresAt);
                                            return (
                                                <tr key={user.id} className="hover:bg-white/5 transition-all group">
                                                    <td className="px-8 py-6 font-bold flex items-center gap-3">
                                                        <User size={18} className="text-brand-primary opacity-50" />
                                                        {user.id}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30' : 'bg-white/10 text-gray-400'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col gap-1">
                                                            <span className={`font-black tracking-tighter italic ${user.tier === 'ULTRA' ? 'text-brand-primary' : user.tier === 'PRO' ? 'text-purple-400' : 'text-gray-400'}`}>
                                                                {user.tier}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    placeholder="개월"
                                                                    className="w-12 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[10px] focus:border-brand-primary outline-none"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            const months = parseInt((e.target as HTMLInputElement).value);
                                                                            if (!isNaN(months)) {
                                                                                const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
                                                                                adminState.updateUserMembership(user.id, { expiresAt });
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                                <span className={`text-[9px] font-bold ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                                                                    {user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : '무제한'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <button
                                                            onClick={() => adminState.updateUserMembership(user.id, { autoAdjustment: !user.autoAdjustment })}
                                                            className={`w-10 h-5 rounded-full relative transition-all ${user.autoAdjustment ? 'bg-brand-primary' : 'bg-white/10'}`}
                                                        >
                                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${user.autoAdjustment ? 'right-1' : 'left-1'}`} />
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {(['BASIC', 'PRO', 'ULTRA'] as const).map((t) => (
                                                                <button
                                                                    key={t}
                                                                    onClick={() => updateUserTier(user.id, t)}
                                                                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${user.tier === t ? 'bg-brand-primary text-black shadow-neon' : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'}`}
                                                                >
                                                                    {t}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Membership Configuration Section */}
                            <div className="space-y-6 pt-8 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={20} className="text-brand-primary" />
                                    <h3 className="text-lg font-black uppercase tracking-tight">Membership Configuration (등급별 정책 설정)</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {(['BASIC', 'PRO', 'ULTRA'] as const).map((tier) => {
                                        const config = adminState.tierConfigs[tier];
                                        if (!config) return null;

                                        return (
                                            <div key={tier} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4 hover:border-brand-primary/30 transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-xs font-black px-2 py-1 rounded border ${tier === 'ULTRA' ? 'text-brand-primary border-brand-primary/30 bg-brand-primary/10' : tier === 'PRO' ? 'text-purple-400 border-purple-400/30 bg-purple-400/10' : 'text-gray-400 border-gray-500/30'}`}>
                                                        {tier}
                                                    </span>
                                                    <span className="text-xs text-gray-500 font-bold">{config.label}</span>
                                                </div>

                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Max Blog Slots (최대 슬롯)</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                value={config.maxSlots}
                                                                onChange={(e) => adminState.updateTierConfig(tier, { maxSlots: parseInt(e.target.value) || 0 })}
                                                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold focus:border-brand-primary outline-none"
                                                            />
                                                            <span className="text-xs text-gray-500 font-bold whitespace-nowrap">개</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Duration (이용 기간)</label>
                                                        <input
                                                            type="text"
                                                            value={config.durationRaw}
                                                            onChange={(e) => adminState.updateTierConfig(tier, { durationRaw: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold focus:border-brand-primary outline-none"
                                                            placeholder="예: 30일"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                            {/* API Key Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                                    <Key size={20} />
                                    <span className="font-bold text-sm uppercase tracking-widest">Global Gemini API Configuration</span>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gemini API Key (Unified)</label>
                                    <input
                                        type="password"
                                        value={localApiKey}
                                        onChange={(e) => setLocalApiKey(e.target.value)}
                                        placeholder="API 키를 입력하면 모든 사용자의 요청에 우선 적용됩니다."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm focus:border-brand-primary outline-none transition-all"
                                    />
                                    <p className="text-[10px] text-gray-600 font-medium">
                                        * 이 키 하나로 텍스트 생성부터 <strong>이미지 분석 및 생성</strong>까지 모두 처리합니다.
                                        <br />
                                        * 관리자가 입력한 키는 로컬 보안 환경 내에서만 관리되며 서버로 직접 전달되지 않습니다.
                                    </p>
                                </div>

                                <button
                                    onClick={handleSaveSettings}
                                    className="flex items-center gap-3 px-8 py-4 bg-brand-primary text-black font-black uppercase tracking-widest rounded-xl hover:shadow-neon transition-all"
                                >
                                    <Save size={20} />
                                    <span>시스템 설정 저장</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Image Test Tab */}
                    {activeTab === 'image-test' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                            <AdminImageTestTool />
                        </motion.div>
                    )}

                </div>
            </div>
        </div>
    );
};
