import React from 'react';
import { BrandSettings } from './features/brand/BrandSettings';
import { KeywordVault } from './features/keywords/KeywordVault';
import { MidnightScout } from './features/keywords/MidnightScout';
import { MarketingCanvas } from './features/content/MarketingCanvas';
import { ContentKitchen } from './features/content/ContentKitchen';
import { JennyChat } from './components/JennyChat';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import { Login } from './features/auth/Login';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { LayoutDashboard, Database, Settings, Sparkles, Lock, BarChart, LogOut, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { activeTab, setActiveTab, contentMode, setContentMode } = useUIStore();

  if (!isAuthenticated) {
    return <Login />;
  }

  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard, minTier: 'Free' },
    { id: 'vault', label: '키워드 보관소', icon: Database, minTier: 'Free' },
    { id: 'content', label: '마케팅 캔버스', icon: Calendar, minTier: 'Silver' },
    { id: 'settings', label: '브랜드 설정', icon: Settings, minTier: 'Free' },
  ];

  // 어드민 전용 메뉴 추가
  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: '관리자 통계', icon: BarChart, minTier: 'Diamond' });
  }

  const checkTierAccess = (minTier: string) => {
    if (!user) return false;
    const tiers = ['Free', 'Silver', 'Diamond'];
    return tiers.indexOf(user.tier) >= tiers.indexOf(minTier);
  };

  return (
    <div className="min-h-screen flex bg-background text-white selection:bg-brand-primary/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col fixed h-full bg-background/50 backdrop-blur-xl z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-neon">
            <Sparkles className="text-black" size={20} />
          </div>
          <span className="font-black text-xl tracking-tight">WONJANG <br /><span className="text-[10px] text-brand-primary opacity-80 tracking-[0.3em]">AI DIRECTOR</span></span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const hasAccess = checkTierAccess(item.minTier);
            return (
              <button
                key={item.id}
                onClick={() => hasAccess && setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-300 group ${activeTab === item.id
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-[0_0_15px_rgba(0,224,255,0.05)]'
                  : hasAccess ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-700 cursor-not-allowed opacity-50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  {item.label}
                </div>
                {!hasAccess && <Lock size={14} className="text-gray-700" />}
                {hasAccess && item.minTier !== 'Free' && (
                  <span className="text-[8px] bg-brand-accent/20 text-brand-accent px-1.5 py-0.5 rounded font-black uppercase">
                    {item.minTier}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/10">
              {user?.tier[0]}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.id}</p>
              <p className="text-[10px] text-gray-500">{user?.tier} Member</p>
            </div>
            <button onClick={logout} className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
          <div className="glass-card p-4 text-xs space-y-2 bg-gradient-to-br from-brand-accent/10 to-transparent">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">{user?.tier} PLAN</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <p className="text-[10px] text-gray-600">베테랑 원장 AI 엔진 가동 중</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10 min-h-screen relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && <MidnightScout />}
            {activeTab === 'vault' && <KeywordVault />}
            {activeTab === 'settings' && <BrandSettings />}
            {activeTab === 'content' && (
              contentMode === 'canvas'
                ? <MarketingCanvas />
                : <ContentKitchen onBack={() => setContentMode('canvas')} />
            )}
            {activeTab === 'admin' && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Jenny Chat UI - Global Component */}
      <JennyChat />
    </div>
  );
};

export default App;
