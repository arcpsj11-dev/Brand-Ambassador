import React from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useProfileStore } from './store/useProfileStore';
import { useUIStore } from './store/useUIStore';
import type { AppTab } from './store/useUIStore';
import { Login } from './features/auth/Login';
import { ProfileSetup } from './features/profile/ProfileSetup';
import { TodayAction } from './features/dashboard/TodayAction';
import { SlotManager } from './features/slot/SlotManager';
import { ContentArchive } from './features/archive/ContentArchive';
import { SlotSelector } from './features/slot/SlotSelector';
import { Step3UnlockOverlay } from './features/dashboard/Step3UnlockOverlay';
import { BlogMotivation } from './features/diagnosis/BlogMotivation';
import { DashboardDiagnosisCard } from './features/dashboard/DashboardDiagnosisCard';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { Sparkles, LogOut, LayoutDashboard, Database, LayoutGrid, Activity, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSlotStore } from './store/useSlotStore';
import { useContentStore } from './store/useContentStore';
import { useAdminStore } from './store/useAdminStore';
import { WelcomeModal } from './features/onboarding/WelcomeModal';

const App: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isProfileComplete } = useProfileStore();
  const { activeTab, setActiveTab } = useUIStore();
  const adminState = useAdminStore();

  // 앱 로드 시 슬롯 시스템 마이그레이션 실행
  React.useEffect(() => {
    if (isAuthenticated) {
      // 마이그레이션 후 활성 슬롯이 없다면 첫 슬롯 지정
      useSlotStore.getState().ensureActiveSlot();
      // 날짜 변경 시 오늘의 액션 상태 초기화 체크
      useContentStore.getState().checkAndResetDailyStatus();
      // 관리자 실시간 데이터 동기화
      adminState.fetchUsers();
      adminState.fetchSettings();
      if (user?.id) adminState.fetchUserStats(user.id);
    }
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return <Login />;
  }

  // 관리자는 프로파일 설정 건너뛰기 가능
  // 일반 사용자는 프로파일 완료 필수
  if (!isProfileComplete && user?.role !== 'admin') {
    return <ProfileSetup />;
  }

  const navItems = [
    { id: 'dashboard' as AppTab, label: '대시보드', icon: LayoutDashboard },
    { id: 'slots' as AppTab, label: '블로그 슬롯', icon: LayoutGrid },
    { id: 'diagnosis' as AppTab, label: '블로그 진단', icon: Activity },
    { id: 'archive' as AppTab, label: '콘텐츠 아카이브', icon: Database },
    { id: 'profile' as AppTab, label: '프로파일 설정', icon: Sparkles },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin' as AppTab, label: '관리자 페이지', icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen flex bg-background text-white selection:bg-brand-primary/30">
      <WelcomeModal />
      <Step3UnlockOverlay />
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col fixed h-full bg-background/50 backdrop-blur-xl z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-neon">
            <Sparkles className="text-black" size={20} />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight block">BRAND AMBASSADOR</span>
            <span className="text-[10px] text-brand-primary opacity-80 tracking-[0.3em] block">MVP DEMO v2.2 (Admin Update)</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                  ? 'bg-brand-primary text-black shadow-neon'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon size={20} className={isActive ? 'text-black' : 'text-gray-500 group-hover:text-brand-primary'} />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 space-y-3 border-t border-white/5">
          {user && (
            <div className="glass-card px-3 py-3 text-xs space-y-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-500 font-bold text-[9px] uppercase tracking-widest">User Stats</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black italic ${user.tier === 'ULTRA' ? 'bg-brand-primary/20 text-brand-primary' : user.tier === 'PRO' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-gray-400'}`}>
                  {user.tier}
                </span>
              </div>

              {(() => {
                const currentUserStats = adminState.users.find(u => u.id === user.id);
                const currentUsage = currentUserStats?.usageCount || 0;
                const maxUsage = adminState.tierConfigs[user.tier]?.maxUsage || 0;
                const usagePercentage = Math.min(100, (currentUsage / (maxUsage || 1)) * 100);
                const completedCount = useContentStore.getState().completedCount;

                return (
                  <div className="space-y-3">
                    {/* AI Generation Usage */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-gray-400 font-bold text-[10px]">AI 글 생성</span>
                        </div>
                        <span className="text-white font-black text-xs">
                          {currentUsage} / {maxUsage}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${usagePercentage}%` }}
                          className={`h-full ${usagePercentage >= 100 ? 'bg-red-500' : 'bg-brand-primary'} shadow-neon-sm`}
                        />
                      </div>
                    </div>

                    {/* Today's Completed Actions */}
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                      <span className="text-gray-500 font-bold text-[9px] uppercase tracking-widest">오늘의 액션 완료</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                        <span className="text-brand-primary font-black text-xs">{completedCount}</span>
                        <span className="text-gray-600 text-[9px] font-bold italic">DONE</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 border-t border-white/5">
                <p className="font-black text-xs truncate text-white/70">{user.id}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all text-sm font-bold"
          >
            <LogOut size={16} />
            로그아웃
          </button>
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
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <header className="space-y-3">
                  <div className="flex items-end justify-between">
                    <h1 className="text-5xl font-black neon-text uppercase italic tracking-tighter leading-none">
                      대시보드
                    </h1>
                    <SlotSelector />
                  </div>
                  <p className="text-gray-500 font-medium">
                    안티그래비티 MVP 데모 - 새로 구현된 기능을 확인하세요
                  </p>
                </header>

                <TodayAction />

                <DashboardDiagnosisCard />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  <div className="space-y-6 flex flex-col">
                    <div className="glass-card p-6 space-y-3 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                        <Sparkles className="text-green-500" size={24} />
                      </div>
                      <h3 className="font-black text-lg">프로파일 완료</h3>
                      <p className="text-sm text-gray-500">초기 설정이 완료되었습니다</p>
                    </div>

                  </div>

                </div>

                <div className="glass-card p-8 space-y-4">
                  <h3 className="font-black text-xl uppercase tracking-tight">구현 완료된 기능</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">프로파일 시스템</h4>
                        <p className="text-xs text-gray-500">3단계 온보딩 완료</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">STEP 권한 제어</h4>
                        <p className="text-xs text-gray-500">단계별 편집 제한</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">리스크 필터 엔진</h4>
                        <p className="text-xs text-gray-500">의료법 위반 자동 검증</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'slots' && <SlotManager />}
            {activeTab === 'diagnosis' && (
              <div className="max-w-6xl mx-auto space-y-8">
                <BlogMotivation />
              </div>
            )}
            {activeTab === 'archive' && <ContentArchive />}
            {activeTab === 'profile' && (
              <div className="max-w-4xl mx-auto">
                <ProfileSetup />
              </div>
            )}
            {activeTab === 'admin' && <AdminDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
