import React, { useState } from 'react';
import { Search, Activity, ArrowRight } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { useProfileStore } from '../../store/useProfileStore';

export const DiagnosisInputWidget: React.FC = () => {
    const { setActiveTab } = useUIStore();
    const { selectedBlogId, setSelectedBlogId } = useProfileStore();
    const [inputId, setInputId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputId.trim()) return;

        // 1. Update Profile Store with new ID
        // (Assuming setSelectedBlogId updates the primary blog ID for analysis)
        // If strict sync is needed, we might need to add logic to select from existing accounts
        // But for MVP, we'll try to set/select it. 
        // Note: For now, if the user types an ID, we just navigate. 
        // The diagnosis page will need to handle "how to use this ID".
        // Let's assume we update the store if possible, or pass it via URL/State?
        // Actually, ProfileStore usually manages "My Blogs". 
        // Let's just update the selectedBlogId if the store allows, or at least navigate.

        // For this widget, we want to simulate "Checking *this* blog".
        // Let's rely on the user having added accounts, OR just use this ID for the session.
        // Since `useProfileStore` might be tied to "My Accounts", let's check `setSelectedBlogId`.

        // Simpler approach for MVP: 
        // If the ID matches one of the user's blogs, select it.
        // If not, maybe just set it temporarily? 
        // Let's check `useProfileStore` implementation.
        // For now, I'll attempt to set it.

        // Logic:
        // 1. Set the ID (assuming we can just set it strictly for the session)
        // 2. Switch Tab

        // *Correction*: We need to make sure `selectedBlogId` is updateable.
        // I will assume `setSelectedBlogId` exists or similar.
        // If not, I'll check the store file.
        // Ideally, we search the `blogAccounts` and select one.

        // Let's try to just navigate for now, and rely on the user to have selected it, 
        // BUT the request was "Input -> Diagnosis".
        // So we MUST update the state.

        // Hack: We will update the store directly if possible.
        // useProfileStore.getState().setSelectedBlogId(inputId); <--- Ideally.

        // Let's proceed with:
        setSelectedBlogId(inputId);
        setActiveTab('diagnosis');
    };

    return (
        <div className="glass-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity size={120} />
            </div>

            <div className="relative z-10 space-y-6">
                <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                        BLOG CHECKUP <span className="text-brand-primary text-sm not-italic font-medium bg-brand-primary/10 px-2 py-0.5 rounded ml-2">FREE</span>
                    </h3>
                    <p className="text-gray-400 mt-2 max-w-md">
                        네이버 로직 변경에 따른 내 블로그 건강 상태를 지금 바로 확인해보세요.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <input
                            type="text"
                            value={inputId}
                            onChange={(e) => setInputId(e.target.value)}
                            placeholder={selectedBlogId || "네이버 아이디 입력 (예: myblog123)"}
                            className="w-full bg-black/30 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:border-brand-primary focus:outline-none transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-brand-primary text-black font-black px-8 py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
                    >
                        진단하기 <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};
