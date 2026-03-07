import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { DatePicker } from './DatePicker';
import { SelectPicker } from './SelectPicker';
import { ConfirmDialog } from './ConfirmDialog';
import { useStore } from '../store';
import { TransactionRecord, TransactionType } from '../types';

interface EditTransactionModalProps {
  record: TransactionRecord;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: () => void;
}

const typeLabels: Record<TransactionType, string> = {
  expense: '支出',
  income: '收入',
  transfer: '转账',
};

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  record,
  onClose,
  onSuccess,
  onDelete,
}) => {
  const { categories, channels, updateRecord } = useStore();

  // Toast 状态
  const [showToast, setShowToast] = useState(false);

  // 表单状态
  const [type, setType] = useState<TransactionType>(record.type);
  const [amount, setAmount] = useState(record.amount.toString());
  const [date, setDate] = useState(record.date);
  const [categoryId, setCategoryId] = useState(record.categoryId);
  const [subCategoryId, setSubCategoryId] = useState(record.subCategoryId || '');
  const [channelId, setChannelId] = useState(record.channelId || '');
  const [note, setNote] = useState(record.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 分类选择弹窗状态
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' });
  };

  // 筛选当前类型的分类
  const filteredCategories = categories.filter(c => c.type === type);

  // 选中的分类
  const selectedCategory = categories.find(c => c.id === categoryId);

  // 监听二级分类变化，自动更新备注（参考记账页逻辑）
  useEffect(() => {
    if (subCategoryId && selectedCategory?.subCategories) {
      const sub = selectedCategory.subCategories.find(s => s.id === subCategoryId);
      if (sub) {
        setNote(sub.name);
      }
    }
  }, [subCategoryId, selectedCategory]);

  // 处理类型切换
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    // 切换类型时清空分类
    setCategoryId('');
    setSubCategoryId('');
    setChannelId('');
  };

  // 处理提交
  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('请输入有效金额');
      return;
    }
    if (!categoryId) {
      alert('请选择分类');
      return;
    }
    if (!channelId) {
      alert('请选择渠道');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRecord(record.id, {
        type,
        amount: parseFloat(amount),
        date,
        categoryId,
        subCategoryId: subCategoryId || undefined,
        channelId,
        note: note || undefined,
      });
      // 显示编辑成功 toast，延迟关闭弹窗以便 toast 可见
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error('Update error:', error);
      alert('保存失败: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 分类显示文字 - 只显示一级分类名字
  const getCategoryDisplayText = () => {
    if (!selectedCategory) return '选择分类...';
    return selectedCategory.name;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-[90%] sm:max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-4 p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-slate-900">编辑明细</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* 表单内容 */}
        <div ref={contentRef} className="px-4 sm:px-4 p-3 sm:p-4 space-y-1.5 sm:space-y-3 overflow-y-auto scrollbar-thin flex-1 min-h-0 pb-10">
          {/* Type Switcher - 只显示支出和收入 */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex-1 py-1 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  type === t
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-0.5 block">
              金额
            </label>
            <div className="relative">
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold transition-colors ${type === 'expense' ? 'text-slate-900' : 'text-green-600'}`}>
                ¥
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-transparent text-xl font-bold outline-none pl-5 py-0.5 border-b-2 border-slate-100 focus:border-blue-500 transition-colors placeholder-slate-200 ${type === 'expense' ? 'text-slate-900' : 'text-green-600'}`}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-0.5 block">
              日期
            </label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          {/* Category Picker */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-0.5 block">
              分类
            </label>
            <div className="relative">
              <button
                onClick={() => {
                  if (!showCategoryPicker) {
                    setTimeout(scrollToBottom, 100);
                  }
                  setShowCategoryPicker(!showCategoryPicker);
                }}
                className="w-full h-9 px-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className={`text-sm ${selectedCategory ? 'text-slate-700' : 'text-slate-400'}`}>
                  {getCategoryDisplayText()}
                </span>
                <Icon name="ChevronLeft" size={14} className="text-slate-400 -rotate-90" />
              </button>

              {/* 分类选择面板 - 一级分类列表，点击后展开二级分类胶囊 */}
              {showCategoryPicker && (
                <div className="absolute top-full left-0 mt-1 mb-2 bg-white rounded-xl shadow-lg border border-slate-100 p-2 pr-3 z-50 w-full max-h-72 overflow-y-auto scrollbar-thin animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* 一级分类列表 - 一行一个 */}
                  <div className="space-y-1">
                    {filteredCategories.map((cat) => (
                      <div key={cat.id}>
                        <button
                          onClick={() => {
                            // 如果点击的是当前已选中的分类，收起二级分类；否则展开新分类
                            if (categoryId === cat.id) {
                              setCategoryId('');
                            } else {
                              setCategoryId(cat.id);
                            }
                            // 如果没有二级分类则关闭选择面板
                            if (!cat.subCategories || cat.subCategories.length === 0) {
                              setShowCategoryPicker(false);
                            }
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all cursor-pointer ${
                            categoryId === cat.id
                              ? 'bg-blue-50'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: (cat.color || '#6366F1') + '20' }}
                          >
                            <Icon
                              name={cat.iconName as any}
                              size={10}
                              style={{ color: cat.color || '#6366F1' }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            categoryId === cat.id ? 'text-blue-700' : 'text-slate-700'
                          }`}>
                            {cat.name}
                          </span>
                          {cat.subCategories && cat.subCategories.length > 0 && (
                            <Icon
                              name="ChevronLeft"
                              size={10}
                              className={`ml-auto text-slate-400 transition-transform ${categoryId === cat.id ? 'rotate-90' : '-rotate-90'}`}
                            />
                          )}
                        </button>

                        {/* 二级分类胶囊 - 展开 */}
                        {categoryId === cat.id && cat.subCategories && cat.subCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 ml-8 pb-1">
                            {cat.subCategories.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setSubCategoryId(sub.id === subCategoryId ? '' : sub.id);
                                  setShowCategoryPicker(false);
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                                  subCategoryId === sub.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Channel */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-0.5 block">
              渠道 <span className="text-red-500">*</span>
            </label>
            <SelectPicker
              value={channelId}
              onChange={setChannelId}
              options={channels}
              placeholder="选择资金账户..."
              onToggle={(isOpen) => {
                if (isOpen) {
                  setTimeout(scrollToBottom, 100);
                }
              }}
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-0.5 block">
              备注
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注..."
              className="w-full h-9 px-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-500 transition-colors outline-none text-sm text-slate-700"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-4 p-3 sm:p-4 border-t border-slate-100 shrink-0 flex gap-3">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-1 py-2 bg-red-50 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors cursor-pointer text-sm"
          >
            删除
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {isSubmitting ? '保存中...' : '确认'}
          </button>
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="删除确认"
        message="确定要删除这条记录吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={() => onDelete()}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Toast Notification */}
      <div className={`fixed top-6 right-6 md:left-auto md:-translate-x-0 bg-white border border-slate-100 text-slate-900 px-4 py-3 rounded-lg shadow-2xl transition-all duration-500 flex items-center gap-2 z-[60] transform ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-200">
          <Icon name="Check" size={14} className="text-white" />
        </div>
        <div>
          <h4 className="font-bold text-xs">编辑成功</h4>
        </div>
      </div>
    </div>
  );
};
