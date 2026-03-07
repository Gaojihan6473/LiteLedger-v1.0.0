import React, { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { useStore } from '../store';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  getDay
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Icon } from '../components/Icon';

// 中国传统节日（按公历日期，简化处理）
const CHINESE_FESTIVALS: Record<string, { name: string; type: 'festival' | 'solar' | 'holiday' }> = {
  '01-01': { name: '元旦', type: 'festival' },
  '02-14': { name: '情人节', type: 'festival' },
  '03-08': { name: '妇女节', type: 'festival' },
  '03-12': { name: '植树节', type: 'festival' },
  '04-01': { name: '愚人节', type: 'solar' },
  '04-04': { name: '清明节', type: 'festival' },
  '04-05': { name: '清明节', type: 'festival' },
  '04-06': { name: '清明节', type: 'festival' },
  '05-01': { name: '劳动节', type: 'holiday' },
  '05-02': { name: '劳动节', type: 'holiday' },
  '05-03': { name: '劳动节', type: 'holiday' },
  '05-04': { name: '青年节', type: 'festival' },
  '06-01': { name: '儿童节', type: 'festival' },
  '07-01': { name: '建党节', type: 'festival' },
  '08-01': { name: '建军节', type: 'festival' },
  '09-10': { name: '教师节', type: 'festival' },
  '10-01': { name: '国庆节', type: 'holiday' },
  '10-02': { name: '国庆节', type: 'holiday' },
  '10-03': { name: '国庆节', type: 'holiday' },
  '10-04': { name: '国庆节', type: 'holiday' },
  '10-05': { name: '国庆节', type: 'holiday' },
  '10-06': { name: '国庆节', type: 'holiday' },
  '10-07': { name: '国庆节', type: 'holiday' },
  '12-24': { name: '平安夜', type: 'festival' },
  '12-25': { name: '圣诞节', type: 'festival' },
};

// 二十四节气（按公历日期，每年略有差异，使用大致日期范围）
const SOLAR_TERMS: Record<number, { name: string; dateRange: [number, number] }> = {
  0: { name: '小寒', dateRange: [5, 7] },
  1: { name: '大寒', dateRange: [20, 21] },
  2: { name: '立春', dateRange: [3, 5] },
  3: { name: '雨水', dateRange: [18, 20] },
  4: { name: '惊蛰', dateRange: [5, 7] },
  5: { name: '春分', dateRange: [20, 22] },
  6: { name: '清明', dateRange: [4, 6] },
  7: { name: '谷雨', dateRange: [19, 21] },
  8: { name: '立夏', dateRange: [5, 7] },
  9: { name: '小满', dateRange: [20, 22] },
  10: { name: '芒种', dateRange: [5, 7] },
  11: { name: '夏至', dateRange: [21, 22] },
  12: { name: '小暑', dateRange: [6, 8] },
  13: { name: '大暑', dateRange: [22, 24] },
  14: { name: '立秋', dateRange: [7, 9] },
  15: { name: '处暑', dateRange: [22, 24] },
  16: { name: '白露', dateRange: [7, 9] },
  17: { name: '秋分', dateRange: [22, 24] },
  18: { name: '寒露', dateRange: [8, 9] },
  19: { name: '霜降', dateRange: [23, 24] },
  20: { name: '立冬', dateRange: [7, 8] },
  21: { name: '小雪', dateRange: [22, 23] },
  22: { name: '大雪', dateRange: [6, 8] },
  23: { name: '冬至', dateRange: [21, 23] },
};

// 获取日期对应的节气
const getSolarTerm = (month: number, day: number): string | null => {
  const term = SOLAR_TERMS[month];
  if (term && day >= term.dateRange[0] && day <= term.dateRange[1]) {
    return term.name;
  }
  return null;
};

export const CalendarPage: React.FC = () => {
  const { records, getFilteredRecords } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const dailyData = useMemo(() => {
    const data = new Map<string, { income: number; expense: number }>();
    const filteredRecords = getFilteredRecords();

    filteredRecords.forEach(record => {
      const dateKey = format(parseISO(record.date), 'yyyy-MM-dd');
      if (!data.has(dateKey)) {
        data.set(dateKey, { income: 0, expense: 0 });
      }
      
      const dayData = data.get(dateKey)!;
      if (record.type === 'income') {
        dayData.income += record.amount;
      } else {
        dayData.expense += record.amount;
      }
    });
    
    return data;
  }, [records, getFilteredRecords]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    records.forEach(r => {
      const d = parseISO(r.date);
      if (isSameMonth(d, currentDate)) {
        if (r.type === 'income') income += r.amount;
        else expense += r.amount;
      }
    });
    return { income, expense };
  }, [records, currentDate]);

  return (
    <Layout activeTab="calendar" title="日历">
      <div className="max-w-6xl mx-auto mt-4 md:mt-6">

        {/* Calendar Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          {/* Header */}
          <div className="p-3 flex items-center justify-between border-b border-slate-100">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <h2 className="text-lg font-bold text-slate-900">
              {format(currentDate, 'yyyy年M月', { locale: zhCN })}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 rotate-180 cursor-pointer">
              <Icon name="ChevronLeft" size={20} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-xs font-medium text-slate-400">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayData = dailyData.get(dateKey);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              const month = day.getMonth();
              const dayOfMonth = day.getDate();
              const dateMd = format(day, 'MM-dd');

              // 获取节日
              const festival = CHINESE_FESTIVALS[dateMd];
              // 获取节气
              const solarTerm = getSolarTerm(month, dayOfMonth);

              // 判断是否是周末
              const dayOfWeek = getDay(day);
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <div
                  key={day.toString()}
                  className={`
                    min-h-[68px] md:min-h-[90px] p-1 md:p-2 border-b border-r border-slate-100 relative
                    ${!isCurrentMonth ? 'bg-slate-50/30' : 'bg-white'}
                    ${idx % 7 === 6 ? 'border-r-0' : ''}
                    ${isToday ? 'bg-blue-50/50' : ''}
                  `}
                >
                  {/* 顶部：日期数字 + 节日/节气 */}
                  <div className="flex items-start justify-between mb-0.5 md:mb-1">
                    {/* 日期数字 - 移动端更小 */}
                    <div className={`
                      text-xs md:text-sm font-semibold flex items-center justify-center w-5 h-5 md:w-7 md:h-7 rounded-md md:rounded-lg shrink-0
                      ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : !isCurrentMonth ? 'text-slate-300' : isWeekend ? 'text-red-500' : 'text-slate-700'}
                    `}>
                      {format(day, 'd')}
                    </div>

                    {/* 节日/节气 - 右侧，与日期数字对齐 */}
                    {(festival || solarTerm) && isCurrentMonth && (
                      <div className={`
                        text-[6px] md:text-[8px] font-medium px-0.5 py-px rounded border leading-tight shrink-0
                        ${festival?.type === 'holiday' ? 'border-red-200 bg-red-50 text-red-600' :
                          festival?.type === 'festival' ? 'border-orange-200 bg-orange-50 text-orange-600' :
                          'border-emerald-200 bg-emerald-50 text-emerald-600'}
                      `}>
                        {festival?.name || solarTerm}
                      </div>
                    )}
                  </div>

                  {/* 金额显示 */}
                  {dayData && (
                    <div className="flex flex-col gap-px">
                      {dayData.expense > 0 && (
                        <div className="text-[9px] md:text-xs font-semibold text-slate-700 truncate bg-slate-100/80 px-0.5 py-0.5 rounded leading-tight">
                          -{formatCurrency(dayData.expense)}
                        </div>
                      )}
                      {dayData.income > 0 && (
                        <div className="text-[9px] md:text-xs font-semibold text-emerald-600 truncate bg-emerald-50/80 px-0.5 py-0.5 rounded leading-tight">
                          +{formatCurrency(dayData.income)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};
