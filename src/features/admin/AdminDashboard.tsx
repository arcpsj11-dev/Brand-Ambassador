import React from 'react';
import { Users, Search, Diamond, TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
    const stats = [
        { label: '전체 사용자', value: '1,284명', icon: Users, color: 'text-blue-400' },
        { label: '누적 탐사 건수', value: '42,931건', icon: Search, color: 'text-brand-primary' },
        { label: '다이아 등급 비중', value: '12%', icon: Diamond, color: 'text-cyan-400' },
        { label: '월 매출 성장률', value: '+24.5%', icon: TrendingUp, color: 'text-green-400' },
    ];

    return (
        <div className="space-y-10 pb-20">
            <section>
                <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                    <Activity className="text-brand-primary" size={32} /> 관리자 관제 센터
                </h2>
                <p className="text-gray-500">제니 마케터 전체 시스템의 이용 현황을 실시간으로 모니터링합니다.</p>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-6 border-white/5 bg-white/[0.02]"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
                    </motion.div>
                ))}
            </section>

            {/* Visual Charts Simulation */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <BarChart3 size={18} className="text-brand-primary" /> 지역별 이용 분석
                    </h3>
                    <div className="flex-1 flex items-end gap-4 pb-4">
                        {[60, 85, 45, 95, 70, 30].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className="w-full bg-brand-primary/20 border-t-2 border-brand-primary rounded-t-lg relative group"
                                >
                                    <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 bg-brand-primary text-black text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                        {h}%
                                    </div>
                                </motion.div>
                                <span className="text-[10px] text-gray-600 font-bold">지역 {i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card p-8 min-h-[400px] flex flex-col">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <PieChart size={18} className="text-brand-accent" /> 멤버십 등급 분포
                    </h3>
                    <div className="flex-1 flex items-center justify-center relative">
                        <div className="w-48 h-48 rounded-full border-[15px] border-white/5 relative">
                            <div className="absolute inset-0 rounded-full border-[15px] border-brand-primary border-t-transparent border-l-transparent rotate-[45deg]" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black">Diamond</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Leading Tier</span>
                            </div>
                        </div>
                        <div className="absolute right-0 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-brand-primary rounded-full" />
                                <span className="text-xs text-gray-400">Diamond (12%)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-white/20 rounded-full" />
                                <span className="text-xs text-gray-400">Silver (35%)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-white/5 rounded-full" />
                                <span className="text-xs text-gray-400">Free (53%)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
