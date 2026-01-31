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
        naverClientId, setNaverClientId,
        naverClientSecret, setNaverClientSecret,
        dallEApiKey, setDallEApiKey,
        nanoBananaApiKey, setNanoBananaApiKey,
        activeImageProvider, setActiveImageProvider,
        activeOccupationId, occupations,
        updateOccupationPrompt,
        users, updateUserTier,
        resetPrompts, fetchUsers, fetchSettings,
    } = adminState;

    const [activeTab, setActiveTab] = useState<'prompts' | 'users' | 'settings' | 'image-test'>('prompts');
    const [localPrompts, setLocalPrompts] = useState(occupations[activeOccupationId]?.prompts);
    const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey);
    const [localNaverClientId, setLocalNaverClientId] = useState(naverClientId);
    const [localNaverClientSecret, setLocalNaverClientSecret] = useState(naverClientSecret);
    const [localDalleKey, setLocalDalleKey] = useState(dallEApiKey);
    const [localNanoKey, setLocalNanoKey] = useState(nanoBananaApiKey);
    const [localProvider, setLocalProvider] = useState(activeImageProvider);

    // Initial fetch from Supabase
    useEffect(() => {
        fetchUsers();
        fetchSettings();
    }, []);

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

    const handleResetToDefaults = async () => {
        if (window.confirm('모든 직업의 프롬프트를 소스 코드의 기본값으로 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
            resetPrompts();

            // Immediately sync local state to show feedback before reload
            if (occupations[activeOccupationId]) {
                setLocalPrompts(occupations[activeOccupationId].prompts);
            }

            alert('프롬프트가 소스 코드의 기본값으로 초기화되었습니다.');

            // Small delay to ensure Zustand persist has finished writing to localStorage
            setTimeout(() => {
                window.location.reload();
            }, 500);
        }
    };

    const handleSaveSettings = () => {
        setGeminiApiKey(localGeminiKey);
        setDallEApiKey(localDalleKey);
        setNanoBananaApiKey(localNanoKey);
        setActiveImageProvider(localProvider);
        setNaverClientId(localNaverClientId);
        setNaverClientSecret(localNaverClientSecret);
        alert('시스템 설정이 저장되었습니다.');
    };

    return (
        <div className="w-full text-white space-y-8">
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center shadow-neon">
                        <ShieldCheck size={24} className="text-black" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Admin Control Panel</h1>
                        <p className="text-sm font-medium text-brand-primary opacity-80 tracking-widest">BRAND AMBASSADOR SYSTEM v8.5</p>
                    </div>
                </div>
            </div>

            {/* Horizontal Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-1">
                <button
                    onClick={() => setActiveTab('prompts')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all font-bold text-sm ${activeTab === 'prompts'
                        ? 'bg-brand-primary text-black'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Wand2 size={16} />
                    <span>프롬프트 제어</span>
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all font-bold text-sm ${activeTab === 'users'
                        ? 'bg-brand-primary text-black'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Users size={16} />
                    <span>회원 등급 조정</span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all font-bold text-sm ${activeTab === 'settings'
                        ? 'bg-brand-primary text-black'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Settings size={16} />
                    <span>시스템 설정</span>
                </button>
                <button
                    onClick={() => setActiveTab('image-test')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all font-bold text-sm ${activeTab === 'image-test'
                        ? 'bg-brand-primary text-black'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <ImageIcon size={16} />
                    <span>이미지 테스트</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-white/0 rounded-2xl min-h-[600px]">
                {/* Header for each tab */}
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold">
                            {activeTab === 'prompts' && 'Prompt Engineering Control'}
                            {activeTab === 'users' && 'User Membership Management'}
                            {activeTab === 'settings' && 'Global System Configuration'}
                            {activeTab === 'image-test' && 'AI Image Generation Test'}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {activeTab === 'prompts' && '직업별 AI 생성 로직의 핵심 프롬프트를 실시간으로 제어합니다.'}
                            {activeTab === 'users' && '회원의 권한 및 멤버십 등급을 수동으로 조정합니다.'}
                            {activeTab === 'settings' && '시스템 전반에 적용되는 API 키 및 기본 타겟을 설정합니다.'}
                            {activeTab === 'image-test' && '프롬프트를 입력하여 이미지 생성 API를 즉시 테스트합니다.'}
                        </p>
                    </div>

                    {/* Occupation Selector only for Prompts Tab */}
                    {activeTab === 'prompts' && (
                        <div className="w-auto">
                            <OccupationSelector />
                        </div>
                    )}
                </div>

                {/* Prompts Tab Content */}
                {activeTab === 'prompts' && localPrompts && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
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
                            <div className="space-y-3 col-span-2">
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

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                            <button
                                onClick={handleResetToDefaults}
                                className="px-6 py-4 bg-white/5 border border-white/10 text-gray-400 font-bold uppercase tracking-widest rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                            >
                                초기화 (코드 기본값)
                            </button>
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

                {/* Users Tab Content */}
                {activeTab === 'users' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden text-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-bold uppercase tracking-widest">
                                        <th className="px-8 py-4">회원 아이디</th>
                                        <th className="px-8 py-4">역할</th>
                                        <th className="px-8 py-4">생성 횟수 (현재/한도)</th>
                                        <th className="px-8 py-4">등급/기한</th>
                                        <th className="px-8 py-4">자동조절</th>
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
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={user.usageCount}
                                                            onChange={async (e) => await adminState.updateUserMembership(user.id, { usageCount: parseInt(e.target.value) || 0 })}
                                                            className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-bold focus:border-brand-primary outline-none"
                                                        />
                                                        <span className="text-gray-500 font-bold">/</span>
                                                        <span className="text-brand-primary font-black italic">
                                                            {adminState.tierConfigs[user.tier]?.maxUsage || 0}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`font-black tracking-tighter italic ${user.tier === 'ULTRA' ? 'text-brand-primary' : user.tier === 'PRO' ? 'text-purple-400' : 'text-gray-400'}`}>
                                                            {user.tier}
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {/* User Duration Editor */}
                                                            <div className="flex items-center bg-black/40 border border-white/10 rounded overflow-hidden">
                                                                <input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    className="w-8 bg-transparent px-1 py-0.5 text-[10px] text-center focus:outline-none"
                                                                    id={`duration-val-${user.id}`}
                                                                />
                                                                <select
                                                                    className="bg-white/5 text-[9px] px-1 py-0.5 border-l border-white/10 focus:outline-none focus:bg-white/10 text-gray-400"
                                                                    id={`duration-unit-${user.id}`}
                                                                    defaultValue="month"
                                                                >
                                                                    <option value="week">주</option>
                                                                    <option value="month">개월</option>
                                                                    <option value="year">년</option>
                                                                </select>
                                                                <button
                                                                    onClick={() => {
                                                                        const valInput = document.getElementById(`duration-val-${user.id}`) as HTMLInputElement;
                                                                        const unitInput = document.getElementById(`duration-unit-${user.id}`) as HTMLSelectElement;
                                                                        const val = parseInt(valInput.value);
                                                                        const unit = unitInput.value;

                                                                        if (!isNaN(val) && val > 0) {
                                                                            let multiplier = 0;
                                                                            if (unit === 'week') multiplier = 7 * 24 * 60 * 60 * 1000;
                                                                            if (unit === 'month') multiplier = 30 * 24 * 60 * 60 * 1000;
                                                                            if (unit === 'year') multiplier = 365 * 24 * 60 * 60 * 1000;

                                                                            const expiresAt = new Date(Date.now() + val * multiplier).toISOString();
                                                                            adminState.updateUserMembership(user.id, { expiresAt });
                                                                            valInput.value = ''; // Reset
                                                                            alert(`${user.id}님의 이용 기간이 ${val}${unit === 'week' ? '주' : unit === 'month' ? '개월' : '년'} 연장되었습니다.`);
                                                                        }
                                                                    }}
                                                                    className="px-2 py-0.5 bg-brand-primary/20 hover:bg-brand-primary text-brand-primary hover:text-black text-[9px] font-bold transition-all"
                                                                >
                                                                    적용
                                                                </button>
                                                            </div>
                                                            <span className={`text-[9px] font-bold ml-1 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
                                                                {user.expiresAt ? new Date(user.expiresAt).toLocaleDateString() : '무제한'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button
                                                        onClick={async () => await adminState.updateUserMembership(user.id, { autoAdjustment: !user.autoAdjustment })}
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
                                                                onClick={async () => await updateUserTier(user.id, t)}
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

                        {/* Config Section */}
                        <div className="space-y-6 pt-8 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={20} className="text-brand-primary" />
                                    <h3 className="text-lg font-black uppercase tracking-tight">Membership Configuration (등급별 정책 설정)</h3>
                                </div>
                                <button
                                    onClick={async () => {
                                        await adminState.saveSettings();
                                        alert('멤버십 정책이 저장되었습니다.');
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-black font-black uppercase tracking-widest rounded-xl hover:shadow-neon transition-all text-xs"
                                >
                                    <Save size={16} />
                                    <span>정책 저장 (Save Policy)</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
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
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Max AI Generations (생성 한도)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={config.maxUsage}
                                                            onChange={(e) => adminState.updateTierConfig(tier, { maxUsage: parseInt(e.target.value) || 0 })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold focus:border-brand-primary outline-none"
                                                        />
                                                        <span className="text-xs text-gray-500 font-bold whitespace-nowrap">회</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase block">Duration (기본 기간)</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            value={config.durationValue || 0}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                adminState.updateTierConfig(tier, { durationValue: val });
                                                            }}
                                                            className="w-16 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-bold focus:border-brand-primary outline-none"
                                                        />
                                                        <select
                                                            value={config.durationUnit || 'month'}
                                                            onChange={(e) => adminState.updateTierConfig(tier, { durationUnit: e.target.value as any })}
                                                            className="bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs font-bold focus:border-brand-primary outline-none text-gray-300"
                                                        >
                                                            <option value="week">주 (Weeks)</option>
                                                            <option value="month">개월 (Months)</option>
                                                            <option value="year">년 (Years)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Settings Tab Content */}
                {activeTab === 'settings' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                        {/* Provider Selection */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                                <ImageIcon size={20} />
                                <span className="font-bold text-sm uppercase tracking-widest">Active Image Provider</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'google', label: 'Google Imagen 4', desc: 'Gemini 기반 이미지 생성' },
                                    { id: 'dalle', label: 'OpenAI DALL-E 3', desc: '고품질 상용 로직' },
                                    { id: 'nano', label: 'Nano Banana', desc: '커스텀/스테이블 디퓨전' }
                                ].map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => setLocalProvider(provider.id as any)}
                                        className={`p-6 rounded-2xl border text-left transition-all ${localProvider === provider.id
                                            ? 'bg-brand-primary/20 border-brand-primary shadow-neon-sm'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        <div className={`text-sm font-black mb-1 ${localProvider === provider.id ? 'text-brand-primary' : 'text-white'}`}>
                                            {provider.label}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium">{provider.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* API Key Section */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                                <Key size={20} />
                                <span className="font-bold text-sm uppercase tracking-widest">API Configuration</span>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                {/* Gemini */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                        <span>Gemini / Google API Key</span>
                                        {localProvider === 'google' && <span className="text-[10px] text-brand-primary border border-brand-primary/30 px-2 rounded">Active</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={localGeminiKey}
                                        onChange={(e) => setLocalGeminiKey(e.target.value)}
                                        placeholder="Google Cloud / AI Studio 키"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm focus:border-brand-primary outline-none transition-all"
                                    />
                                </div>

                                {/* DALL-E */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                        <span>OpenAI API Key (DALL-E)</span>
                                        {localProvider === 'dalle' && <span className="text-[10px] text-brand-primary border border-brand-primary/30 px-2 rounded">Active</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={localDalleKey}
                                        onChange={(e) => setLocalDalleKey(e.target.value)}
                                        placeholder="sk-..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm focus:border-brand-primary outline-none transition-all"
                                    />
                                </div>

                                {/* Nano Banana */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                        <span>Nano Banana API Key</span>
                                        {localProvider === 'nano' && <span className="text-[10px] text-brand-primary border border-brand-primary/30 px-2 rounded">Active</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={localNanoKey}
                                        onChange={(e) => setLocalNanoKey(e.target.value)}
                                        placeholder="Nano Banana 전용 키"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm focus:border-brand-primary outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 border-l-4 border-brand-primary p-4 rounded-r-xl">
                                <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                                    * 선택된 <strong>Active Image Provider</strong>에 따라 위 API 키들 중 하나가 이미지 생성에 사용됩니다.
                                    <br />
                                    * Gemini 키는 텍스트 생성에는 기본적으로 사용되며, 이미지를 'Google'로 설정 시 이미지 생성에도 활용됩니다.
                                </p>
                            </div>

                            {/* Naver Blog API Configuration */}
                            <div className="space-y-6 pt-8 border-t border-white/5">
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                    <Key size={20} />
                                    <span className="font-bold text-sm uppercase tracking-widest">Naver Blog API Configuration</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Naver Client ID</label>
                                        <input
                                            type="text"
                                            value={localNaverClientId}
                                            onChange={(e) => setLocalNaverClientId(e.target.value)}
                                            placeholder="네이버 개발자센터에서 발급받은 Client ID"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm focus:border-brand-primary outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Naver Client Secret</label>
                                        <input
                                            type="password"
                                            value={localNaverClientSecret}
                                            onChange={(e) => setLocalNaverClientSecret(e.target.value)}
                                            placeholder="네이버 개발자센터에서 발급받은 Client Secret"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm focus:border-brand-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <p className="text-[10px] text-gray-600 font-medium">
                                    * 네이버 블로그 데이터 수집 및 점수 분석에 사용됩니다.
                                    <br />
                                    * API 신청: <a href="https://developers.naver.com/products/search/" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">네이버 개발자 센터</a>
                                    <br />
                                    * 입력하지 않으면 Mock 데이터로 UI를 시뮬레이션합니다.
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

                {/* Image Test Tab Content */}
                {activeTab === 'image-test' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                        <AdminImageTestTool />
                    </motion.div>
                )}
            </div>
        </div>
    );
};
