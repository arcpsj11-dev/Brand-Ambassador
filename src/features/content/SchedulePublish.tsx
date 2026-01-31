import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface SchedulePublishProps {
    onSchedule: (date: Date) => void;
    defaultEnabled?: boolean;
}

/**
 * 예약 발행 설정 컴포넌트
 */
export const SchedulePublish: React.FC<SchedulePublishProps> = ({
    onSchedule,
    defaultEnabled = true,
}) => {
    const [isScheduled, setIsScheduled] = useState(defaultEnabled);

    // 기본값: 내일 오전 10시
    const getDefaultDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        return tomorrow;
    };

    const [scheduledDate, setScheduledDate] = useState(getDefaultDate());

    // 날짜를 input[type="datetime-local"] 형식으로 변환
    const formatDateTimeLocal = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // datetime-local 값을 Date로 변환
    const parseDateTimeLocal = (value: string) => {
        return new Date(value);
    };

    const handleSchedule = () => {
        if (isScheduled) {
            onSchedule(scheduledDate);
        }
    };

    return (
        <div className="glass-card p-4 space-y-4">
            {/* 토글 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar size={20} className="text-brand-primary" />
                    <div>
                        <h4 className="font-bold text-sm">예약 발행</h4>
                        <p className="text-xs text-gray-500">
                            {isScheduled ? '예약 발행이 활성화되었습니다' : '즉시 발행'}
                        </p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isScheduled}
                        onChange={(e) => setIsScheduled(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                </label>
            </div>

            {/* 날짜/시간 선택 */}
            {isScheduled && (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} />
                            발행 일시
                        </label>
                        <input
                            type="datetime-local"
                            value={formatDateTimeLocal(scheduledDate)}
                            onChange={(e) => setScheduledDate(parseDateTimeLocal(e.target.value))}
                            min={formatDateTimeLocal(new Date())}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-brand-primary transition-all outline-none"
                        />
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-brand-primary/5 border border-brand-primary/20 rounded-lg">
                        <Calendar size={16} className="text-brand-primary mt-0.5" />
                        <div>
                            <p className="text-xs font-bold text-brand-primary">
                                예약 발행 기본 설정
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                콘텐츠는 선택한 날짜와 시간에 자동으로 발행됩니다. 기본값은 내일 오전 10시입니다.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleSchedule}
                        className="w-full px-4 py-3 rounded-xl bg-brand-primary text-black font-bold hover:shadow-neon transition-all"
                    >
                        예약 설정
                    </button>
                </div>
            )}

            {!isScheduled && (
                <button
                    onClick={() => onSchedule(new Date())}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-medium transition-all"
                >
                    즉시 발행
                </button>
            )}
        </div>
    );
};
