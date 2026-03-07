
import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { useStore } from '../store';
import { CategoryStat, TransactionRecord } from '../types';

// Date Utility Functions
const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

const startOfWeek = (date: Date, options?: { weekStartsOn: number }) => {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust to Monday start (weekStartsOn: 1)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfWeek = (date: Date, options?: { weekStartsOn: number }) => {
  const d = startOfWeek(date, options);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const addMonths = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
};

const subMonths = (date: Date, amount: number) => {
  return addMonths(date, -amount);
};

const addWeeks = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + amount * 7);
  return d;
};

const subWeeks = (date: Date, amount: number) => {
  return addWeeks(date, -amount);
};

const addDays = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
};

const subDays = (date: Date, amount: number) => {
  return addDays(date, -amount);
};

const format = (date: Date, fmt: string) => {
  if (fmt === 'MM.dd') {
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${m}.${d}`;
  }
  return date.toLocaleDateString();
};

type ViewMode = 'month' | 'week' | 'day';

export const StatsPage: React.FC = () => {
  const { records, categories, getFilteredRecords } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { startDate, endDate, dateLabel } = useMemo(() => {
    let start: Date, end: Date, label: string;

    if (viewMode === 'month') {
      start = startOfMonth(currentDate);
      end = endOfMonth(currentDate);
      label = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
    } else if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
      const startStr = format(start, 'MM.dd');
      const endStr = format(end, 'MM.dd');
      label = `${startStr} - ${endStr}`;
    } else {
      start = startOfDay(currentDate);
      end = endOfDay(currentDate);
      const m = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const d = currentDate.getDate().toString().padStart(2, '0');
      const y = currentDate.getFullYear();
      label = `${y}.${m}.${d}`;
    }

    return { startDate: start, endDate: end, dateLabel: label };
  }, [viewMode, currentDate]);

  const statsData = useMemo(() => {
    const filteredRecords = getFilteredRecords();
    const periodRecords = filteredRecords.filter(r => {
      const d = new Date(r.date);
      return d >= startDate && d <= endDate;
    });

    const expenseRecords = periodRecords.filter(r => r.type === 'expense');
    const incomeRecords = periodRecords.filter(r => r.type === 'income');

    const totalExpense = expenseRecords.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncome = incomeRecords.reduce((acc, curr) => acc + curr.amount, 0);
    const netIncome = totalIncome - totalExpense;

    const processStats = (recs: TransactionRecord[], total: number) => {
      const stats: CategoryStat[] = [];
      
      recs.forEach(r => {
        const cat = categories.find(c => c.id === r.categoryId);
        if (!cat) return;

        const existing = stats.find(s => s.categoryId === cat.id);
        if (existing) {
          existing.total += r.amount;
        } else {
          stats.push({
            categoryId: cat.id,
            categoryName: cat.name,
            color: cat.color || '#94a3b8',
            total: r.amount,
            percentage: 0
          });
        }
      });

      // Calculate percentages and sort
      stats.forEach(stat => {
        stat.percentage = total > 0 ? Math.round((stat.total / total) * 100) : 0;
      });
      
      stats.sort((a, b) => b.total - a.total);
      return stats; // 显示所有分类
    };

    return {
      totalExpense,
      totalIncome,
      netIncome,
      expenseStats: processStats(expenseRecords, totalExpense),
      incomeStats: processStats(incomeRecords, totalIncome)
    };
  }, [records, categories, startDate, endDate]);

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => subMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subDays(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(prev => addMonths(prev, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addDays(prev, 1));
    }
  };

  const renderSection = (
    amount: number,
    stats: CategoryStat[],
    gradientFrom: string,
    gradientTo: string,
    emptyMessage: string
  ) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 grid grid-cols-1 sm:grid-cols-20 gap-8 mb-8 relative">
      {/* 左侧：环形图 (9/20) */}
      <div className="sm:col-span-9 flex items-center sm:border-r sm:border-slate-100 sm:pr-8">
        <div className="flex-1 flex items-center justify-center relative min-h-[220px]">
          {amount > 0 ? (
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => `¥${value.toLocaleString()}`}
                />
                <Pie
                  data={stats}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={2}
                  dataKey="total"
                  nameKey="categoryName"
                >
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <Icon name="PieChart" size={32} className="text-slate-300 mb-2" />
              <p className="text-slate-400">{emptyMessage}</p>
            </div>
          )}
          {/* Center Text */}
          {amount > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="block text-3xl font-bold text-slate-900 leading-none">{stats.length}</span>
              <span className="text-xs text-slate-400 uppercase">分类</span>
            </div>
          )}
        </div>
      </div>

      {/* 右侧：图例 (11/20) */}
      <div className="sm:col-span-11 flex items-center">
        <div className="flex-1 w-[90%] mx-auto">
          {stats.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {stats.map((stat) => (
                <div key={stat.categoryId} className="flex flex-col gap-1 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                  {/* 顶部：颜色点 + 分类名称 + 金额 */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: stat.color }}></div>
                      <span className="font-medium text-slate-700 text-sm truncate">{stat.categoryName}</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm whitespace-nowrap">¥{stat.total.toLocaleString()}</span>
                  </div>
                  {/* 底部：进度条 + 百分比 */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 w-10 text-right">{stat.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 text-sm text-center py-4">
              暂无数据
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Layout activeTab="stats" title="消费统计">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
           
           <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
             <div className="flex items-center gap-2 px-2">
                <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer">
                  <Icon name="ChevronLeft" size={18} />
                </button>
                <span className="text-sm font-semibold min-w-[100px] text-center">{dateLabel}</span>
                <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 rotate-180 transition-colors cursor-pointer">
                  <Icon name="ChevronLeft" size={18} />
                </button>
             </div>
             <div className="w-px h-6 bg-slate-200 mx-1"></div>
             <div className="flex bg-slate-100 rounded-lg p-0.5">
               <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${viewMode === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
               >
                 月
               </button>
               <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${viewMode === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
               >
                 周
               </button>
               <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${viewMode === 'day' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
               >
                 日
               </button>
             </div>
           </div>
        </div>
        
        {/* Summary Cards */}
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-6 mb-8">
          {/* 净收入 - 移动端单独一行突出显示 */}
          <div
            className="md:col-start-2 md:row-start-1 rounded-2xl p-4 md:p-6 text-white shadow-lg"
            style={{ backgroundColor: '#0284C7' }}
          >
            <span className="text-white text-xs md:text-base font-medium uppercase tracking-wider">净收入</span>
            <div className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">
              ¥{statsData.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* 第二行：总支出和总收入 */}
          <div className="grid grid-cols-2 gap-3 md:contents">
            <div className="bg-slate-600 rounded-2xl p-4 md:p-6 text-white shadow-lg col-span-1">
              <span className="text-white text-xs md:text-base font-medium uppercase tracking-wider">总支出</span>
              <div className="text-xl md:text-4xl font-bold mt-1 md:mt-2">
                ¥{statsData.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="rounded-2xl p-4 md:p-6 text-white shadow-lg col-span-1" style={{ backgroundColor: '#16A34A' }}>
              <span className="text-white text-xs md:text-base font-medium uppercase tracking-wider">总收入</span>
              <div className="text-xl md:text-4xl font-bold mt-1 md:mt-2">
                ¥{statsData.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* 总支出卡片 */}
        <h2 className="text-xl font-bold text-slate-700 mb-4">总支出构成</h2>
        {renderSection(
          statsData.totalExpense,
          statsData.expenseStats,
          'from-blue-600',
          'to-blue-700',
          '暂无支出数据'
        )}

        {/* 总收入卡片 */}
        <h2 className="text-xl font-bold text-slate-700 mb-4">总收入构成</h2>
        {renderSection(
          statsData.totalIncome,
          statsData.incomeStats,
          'from-green-600',
          'to-green-700',
          '暂无收入数据'
        )}
      </div>
    </Layout>
  );
};
