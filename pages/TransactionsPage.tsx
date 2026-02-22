
import React, { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useConfirmDialog } from '../hooks/useConfirmDialog';
import { useStore } from '../store';
import { DayGroup, TransactionRecord } from '../types';

export const TransactionsPage: React.FC = () => {
  const { records, categories, channels, deleteRecord, getFilteredRecords } = useStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    isOpen: confirmDialogOpen,
    message: confirmDialogMessage,
    confirm,
    handleConfirm,
    handleCancel: handleConfirmCancel,
  } = useConfirmDialog();

  // Group records by day
  const groupedRecords = useMemo(() => {
    // 过滤掉初始余额记录
    const filteredRecords = getFilteredRecords();
    // 1. Filter by selected month
    const filtered = filteredRecords.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
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
  }, [records, selectedMonth]);

  const handleDelete = (id: string) => {
    setDeleteId(id);
    confirm('确定要删除这条记录吗？').then((result) => {
      if (result === 'confirm') {
        deleteRecord(id);
      }
      setDeleteId(null);
    });
  };

  const handleConfirmDialogConfirm = () => {
    if (deleteId) {
      deleteRecord(deleteId);
    }
    handleConfirm();
    setDeleteId(null);
  };

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
    <Layout activeTab="transactions">
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        message={confirmDialogMessage}
        title="删除确认"
        showRemember={false}
        onConfirm={handleConfirmDialogConfirm}
        onCancel={handleConfirmCancel}
      />
      <div className="max-w-6xl mx-auto">
        {/* Header with Month Selector */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-900">账单明细</h1>
          <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1.5">
             <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors cursor-pointer">
                <Icon name="ChevronLeft" size={20} />
             </button>
             <span className="mx-4 text-base font-semibold min-w-[100px] text-center">
               {selectedMonth.getFullYear()}年{selectedMonth.getMonth() + 1}月
             </span>
             <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 rotate-180 transition-colors cursor-pointer">
                <Icon name="ChevronLeft" size={20} />
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
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-700">
                    {formatDateHeader(group.date)}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                </div>
                <div className="flex gap-4 text-sm">
                  {group.totalIncome > 0 && (
                    <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded">
                      收 +{group.totalIncome.toFixed(2)}
                    </span>
                  )}
                  {group.totalExpense > 0 && (
                    <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded">
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
                      className={`flex items-center justify-between p-4 sm:p-5 ${
                        index !== group.records.length - 1 ? 'border-b border-slate-50' : ''
                      } hover:bg-slate-50 transition-colors group relative`}
                    >
                      <div className="flex items-center gap-4 min-w-[120px]">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 text-slate-500"
                          style={{
                            backgroundColor: isTransfer ? '#f3e8ff' : (category?.color ? `${category.color}15` : undefined),
                            color: isTransfer ? '#9333ea' : category?.color
                          }}
                        >
                          <Icon
                            name={isTransfer ? 'ArrowLeftRight' : (category?.iconName || 'CircleDashed')}
                            size={22}
                          />
                        </div>
                        <span className="text-sm font-semibold text-slate-900">
                          {isTransfer
                            ? (subCategory?.name || '未知')
                            : (category?.name || '未知')}
                        </span>
                      </div>

                      <div className="flex-1 mx-4">
                        {/* 转账时显示对方账户 */}
                        {isTransfer && record.note && (
                          <span className="text-xs text-slate-400 line-clamp-1 break-all">
                            {record.note}
                          </span>
                        )}
                        {/* 非转账记录显示备注 */}
                        {!isTransfer && record.note && (
                          <span className="text-xs text-slate-400 line-clamp-1 break-all">
                            {record.note}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-6">
                        {channel && (
                          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: channel.color }}></div>
                             <span className="text-[10px] font-medium text-slate-500">{channel.name}</span>
                          </div>
                        )}

                        <span className={`text-base font-bold tabular-nums text-right min-w-[90px] ${
                          record.type === 'income' || isTransferIn ? 'text-green-600' : 'text-slate-900'
                        }`}>
                          {(record.type === 'income' || isTransferIn) ? '+' : '-'}{Math.abs(record.amount).toFixed(2)}
                        </span>

                        <button
                          onClick={() => handleDelete(record.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="删除"
                        >
                          <Icon name="Trash2" size={18} />
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
    </Layout>
  );
};
