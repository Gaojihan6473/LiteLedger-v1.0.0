
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { EditTransactionModal } from '../components/EditTransactionModal';
import { SelectPicker } from '../components/SelectPicker';
import { useStore } from '../store';
import { DayGroup, TransactionRecord } from '../types';

export const TransactionsPage: React.FC = () => {
  const { records, categories, channels, deleteRecord, getFilteredRecords } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [editingRecord, setEditingRecord] = useState<TransactionRecord | null>(null);
  const [showDeleteToast, setShowDeleteToast] = useState(false);

  // 筛选状态
  const [showFilter, setShowFilter] = useState(false);
  const [filterCategoryIds, setFilterCategoryIds] = useState<string>('');
  const [filterChannelIds, setFilterChannelIds] = useState<string>('');
  const [filterAmountMin, setFilterAmountMin] = useState<string>('');
  const [filterAmountMax, setFilterAmountMax] = useState<string>('');

  // 将逗号分隔的字符串转换为数组
  const filterCategoryIdArray = filterCategoryIds ? filterCategoryIds.split(',') : [];
  const filterChannelIdArray = filterChannelIds ? filterChannelIds.split(',') : [];

  // 筛选区域 ref，用于点击外部关闭
  const filterRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭筛选区域
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFilter]);

  // 判断是否有激活的筛选
  const hasActiveFilters = filterCategoryIds || filterChannelIds || filterAmountMin || filterAmountMax;

  // Group records by day
  const groupedRecords = useMemo(() => {
    // 过滤掉初始余额记录
    const filteredRecords = getFilteredRecords();
    // 1. Filter by selected month
    const filtered = filteredRecords.filter(r => {
      const d = new Date(r.date);
      const monthMatch = d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();

      // 分类筛选（支持多选）
      const categoryMatch = filterCategoryIdArray.length === 0 || filterCategoryIdArray.includes(r.categoryId);

      // 渠道筛选（支持多选）
      const channelMatch = filterChannelIdArray.length === 0 || (r.channelId && filterChannelIdArray.includes(r.channelId));

      // 金额筛选
      const amount = Math.abs(r.amount);
      const amountMatch = (!filterAmountMin || amount >= parseFloat(filterAmountMin)) &&
                         (!filterAmountMax || amount <= parseFloat(filterAmountMax));

      return monthMatch && categoryMatch && channelMatch && amountMatch;
    });

    // Sort by createdAt desc (newest first within same day)
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // 3. Group by day (records are already sorted by time within each day)
    const groups: DayGroup[] = [];
    filtered.forEach(record => {
      const dateKey = record.date.split('T')[0];
      let group = groups.find(g => g.date === dateKey);
      
      if (!group) {
        group = { date: dateKey, records: [], totalExpense: 0, totalIncome: 0 };
        groups.push(group);
      }
      
      group.records.push(record);
      // 普通支出/收入计入每日汇总（转账记录不计入）
      if (record.type === 'expense') {
        group.totalExpense += record.amount;
      } else if (record.type === 'income') {
        group.totalIncome += record.amount;
      }
    });

    // Sort groups by date desc (newest day first: today on top)
    groups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return groups;
  }, [records, selectedMonth, filterCategoryIds, filterChannelIds, filterAmountMin, filterAmountMax]);

  const getCategory = (id: string) => categories.find(c => c.id === id);
  const getChannel = (id?: string) => channels.find(c => c.id === id);
  const getSubCategory = (categoryId: string, subCategoryId?: string) => {
    const category = getCategory(categoryId);
    return category?.subCategories?.find(sc => sc.id === subCategoryId);
  };

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Calculate difference in days
    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    
    // Custom formatting to avoid locale dependency issues
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = weekDays[date.getDay()];
    
    return `${month}月${day}日 ${weekDay}`;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedMonth(newDate);
  };

  return (
    <Layout activeTab="transactions" title="账单明细">
      <div className="max-w-6xl mx-auto pb-6">
        {/* Header with Filter and Month Selector */}
        <div className="flex items-center justify-between mb-4 md:mb-8 mt-2 md:mt-0">
          {/* 左侧：筛选按钮 + 筛选面板 */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-1.5 rounded-t-lg transition-colors relative z-10 ${
                hasActiveFilters
                  ? 'text-blue-600 bg-blue-50'
                  : showFilter
                    ? 'text-blue-600 bg-white shadow-xl'
                    : 'text-slate-400 hover:bg-slate-100'
              }`}
              title="筛选"
            >
              <Icon name="Filter" size={18} />
            </button>

            {/* 筛选面板 - 连接在筛选按钮下方 */}
            {showFilter && (
              <div className="absolute top-full left-0 -mt-px bg-white rounded-b-xl rounded-tr-xl shadow-xl border border-slate-100 border-t-0 border-l-0 p-3 z-30 w-64 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* 分类筛选 */}
                <div className="mb-2.5">
                  <label className="text-[10px] font-medium text-slate-400 mb-1 block">分类</label>
                  <SelectPicker
                    value={filterCategoryIds}
                    onChange={setFilterCategoryIds}
                    options={categories}
                    placeholder="全部（多选）"
                    multiple
                  />
                </div>

                {/* 渠道筛选 */}
                <div className="mb-2.5">
                  <label className="text-[10px] font-medium text-slate-400 mb-1 block">渠道</label>
                  <SelectPicker
                    value={filterChannelIds}
                    onChange={setFilterChannelIds}
                    options={channels}
                    placeholder="全部（多选）"
                    multiple
                  />
                </div>

                {/* 金额范围筛选 */}
                <div className="flex gap-2 mb-2.5">
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-slate-400 mb-1 block">最小</label>
                    <input
                      type="number"
                      value={filterAmountMin}
                      onChange={(e) => setFilterAmountMin(e.target.value)}
                      placeholder="0"
                      className="w-full h-8 px-2.5 text-xs bg-slate-50 rounded-lg border border-slate-200 text-slate-700 placeholder-slate-300"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-medium text-slate-400 mb-1 block">最大</label>
                    <input
                      type="number"
                      value={filterAmountMax}
                      onChange={(e) => setFilterAmountMax(e.target.value)}
                      placeholder="不限"
                      className="w-full h-8 px-2.5 text-xs bg-slate-50 rounded-lg border border-slate-200 text-slate-700 placeholder-slate-300"
                    />
                  </div>
                </div>

                {/* 清空按钮 */}
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setFilterCategoryIds('');
                      setFilterChannelIds('');
                      setFilterAmountMin('');
                      setFilterAmountMax('');
                    }}
                    className="w-full h-7 text-[10px] font-medium text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    清空筛选条件
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 右侧：月份选择器 */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
             <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer">
                <Icon name="ChevronLeft" size={18} />
             </button>
             <span className="mx-4 text-sm font-semibold min-w-[100px] text-center">
               {selectedMonth.getFullYear()}年{selectedMonth.getMonth() + 1}月
             </span>
             <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 rotate-180 transition-colors cursor-pointer">
                <Icon name="ChevronLeft" size={18} />
             </button>
          </div>
        </div>

        {/* Empty State */}
        {groupedRecords.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-32 text-center opacity-50">
            <div className="w-32 h-32 bg-slate-200 rounded-full flex items-center justify-center mb-6">
              <Icon name="List" size={56} className="text-slate-400" />
            </div>
            <p className="text-xl font-medium text-slate-600 mb-2">本月暂无账单</p>
            <p className="text-slate-400">快去记一笔吧！</p>
          </div>
        )}

        {/* List */}
        <div className="space-y-8">
          {groupedRecords.map((group) => (
            <div key={group.date}>
              {/* Date Header */}
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-700">
                    {formatDateHeader(group.date)}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                </div>
                <div className="flex gap-2 text-[10px] sm:text-xs">
                  {group.totalIncome > 0 && (
                    <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                      收 +{group.totalIncome.toFixed(2)}
                    </span>
                  )}
                  {group.totalExpense > 0 && (
                    <span className="text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                      支 -{group.totalExpense.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Records Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {group.records.map((record, index) => {
                  const category = getCategory(record.categoryId);
                  const channel = getChannel(record.channelId);
                  const subCategory = getSubCategory(record.categoryId, record.subCategoryId);
                  const isTransfer = record.type === 'transfer';
                  const isTransferIn = isTransfer && subCategory?.name === '转入';

                  return (
                    <div
                      key={record.id}
                      className={`flex items-center justify-between p-3 sm:p-4 ${
                        index !== group.records.length - 1 ? 'border-b border-slate-50' : ''
                      } hover:bg-slate-50 transition-colors group relative`}
                    >
                      {/* Left: Icon + Category + Note */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 flex-shrink-0"
                          style={{
                            backgroundColor: isTransfer ? '#f3e8ff' : (category?.color ? `${category.color}15` : undefined),
                            color: isTransfer ? '#9333ea' : category?.color
                          }}
                        >
                          <Icon
                            name={isTransfer ? 'ArrowLeftRight' : (category?.iconName || 'CircleDashed')}
                            size={16}
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                            {isTransfer
                              ? (subCategory?.name || '未知')
                              : (category?.name || '未知')}
                          </div>
                          {/* Note below category */}
                          {record.note && (
                            <div className="text-[10px] sm:text-xs text-slate-400 truncate">
                              {record.note}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Channel + Amount + Edit Button */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
                        {/* Channel info - left of amount */}
                        {channel && (
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: channel.color }}></div>
                            <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">{channel.name}</span>
                          </div>
                        )}
                        <span className={`text-sm sm:text-base font-bold tabular-nums ${
                          record.type === 'income' || isTransferIn ? 'text-green-600' : 'text-slate-900'
                        }`}>
                          {(record.type === 'income' || isTransferIn) ? '+' : '-'}{Math.abs(record.amount).toFixed(2)}
                        </span>
                        <button
                          onClick={() => {
                            setEditingRecord(record);
                          }}
                          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-all cursor-pointer"
                          title="编辑"
                        >
                          <Icon name="Pencil" size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 编辑弹窗 */}
      {editingRecord && (
        <EditTransactionModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSuccess={() => setEditingRecord(null)}
          onDelete={() => {
            deleteRecord(editingRecord.id);
            setEditingRecord(null);
            // 显示删除成功 toast
            setShowDeleteToast(true);
            setTimeout(() => setShowDeleteToast(false), 1500);
          }}
        />
      )}

      {/* Delete Success Toast */}
      <div className={`fixed top-6 right-6 md:left-auto md:-translate-x-0 bg-white border border-slate-100 text-slate-900 px-4 py-3 rounded-lg shadow-2xl transition-all duration-500 flex items-center gap-2 z-[60] transform ${showDeleteToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-200">
          <Icon name="Check" size={14} className="text-white" />
        </div>
        <div>
          <h4 className="font-bold text-xs">删除成功</h4>
        </div>
      </div>
    </Layout>
  );
};
