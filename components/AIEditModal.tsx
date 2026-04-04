import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { DatePicker } from './DatePicker';
import { SelectPicker } from './SelectPicker';
import { useStore } from '../store';
import { ParsedTransaction } from '../lib/minimax';

interface AIEditModalProps {
  data: ParsedTransaction;
  onClose: () => void;
  onConfirm: (edited: ParsedTransaction) => void;
}

const typeLabels = {
  expense: '支出',
  income: '收入',
  transfer: '转账',
};

export const AIEditModal: React.FC<AIEditModalProps> = ({
  data,
  onClose,
  onConfirm,
}) => {
  const { categories, channels } = useStore();

  // 初始化时将 name 转换为 id（用于 SelectPicker）
  const getChannelId = (name: string) => channels.find(c => c.name === name)?.id || '';
  const getCategoryId = (name: string) => categories.find(c => c.name === name)?.id || '';

  // 表单状态 - channel/category 用 id 存储（SelectPicker 需要）
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(data.type);
  const [amount, setAmount] = useState(data.amount?.toString() || '');
  const [date, setDate] = useState(data.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(getCategoryId(data.category));
  const [channelId, setChannelId] = useState(getChannelId(data.channel));
  const [toChannelId, setToChannelId] = useState(getChannelId(data.toChannel || ''));
  const [note, setNote] = useState(data.note || '');

  const contentRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    contentRef.current?.scrollTo({ top: contentRef.current.scrollHeight, behavior: 'smooth' });
  };

  // 筛选当前类型的分类
  const filteredCategories = categories.filter(c => c.type === type);

  // 判断是否是转账类型
  const isTransfer = type === 'transfer';

  // 处理类型切换
  const handleTypeChange = (newType: 'expense' | 'income' | 'transfer') => {
    setType(newType);
    setCategoryId('');
    setChannelId('');
    setToChannelId('');
  };

  // 处理提交
  const handleSubmit = () => {
    if (!isTransfer && (!amount || parseFloat(amount) <= 0)) {
      alert('请输入有效金额');
      return;
    }
    if (!isTransfer && !categoryId) {
      alert('请选择分类');
      return;
    }
    if (!isTransfer && !channelId) {
      alert('请选择渠道');
      return;
    }
    if (isTransfer && !channelId) {
      alert('请选择转出账户');
      return;
    }
    if (isTransfer && !toChannelId) {
      alert('请选择转入账户');
      return;
    }

    // 将 id 转换为 name
    const categoryName = categories.find(c => c.id === categoryId)?.name || '';
    const channelName = channels.find(c => c.id === channelId)?.name || '';
    const toChannelName = channels.find(c => c.id === toChannelId)?.name || '';

    const edited: ParsedTransaction = {
      type,
      amount: amount || '',
      category: isTransfer ? '转账' : categoryName,
      subCategory: undefined,
      channel: channelName,
      toChannel: isTransfer ? toChannelName : undefined,
      date,
      note,
    };

    onConfirm(edited);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-[90%] sm:max-w-sm flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-4 p-3 sm:p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-bold text-slate-900">编辑记账</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* 表单内容 */}
        <div ref={contentRef} className="px-4 sm:px-4 p-3 sm:p-4 space-y-1.5 sm:space-y-3 overflow-y-auto scrollbar-thin flex-1 min-h-0 pb-10">
          {/* Type Switcher - 支出/收入/转账 */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button
                key={t}
                onClick={() => handleTypeChange(t)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold text-center transition-all ${
                  type === t
                    ? 'bg-white text-slate-900 shadow-sm cursor-pointer'
                    : 'text-slate-500 hover:text-slate-700 cursor-pointer'
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
              <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-lg font-bold transition-colors ${isTransfer ? 'text-slate-900' : (type === 'expense' ? 'text-slate-900' : 'text-green-600')}`}>
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

          {/* 转账类型特殊UI */}
          {isTransfer ? (
            <>
              {/* 转出账户 */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-0.5 block">
                  转出账户
                </label>
                <SelectPicker
                  value={channelId}
                  onChange={setChannelId}
                  options={channels}
                  placeholder="选择转出账户..."
                  onToggle={(isOpen) => {
                    if (isOpen) setTimeout(scrollToBottom, 100);
                  }}
                />
              </div>
              {/* 转入账户 */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-0.5 block">
                  转入账户
                </label>
                <SelectPicker
                  value={toChannelId}
                  onChange={setToChannelId}
                  options={channels}
                  placeholder="选择转入账户..."
                  onToggle={(isOpen) => {
                    if (isOpen) setTimeout(scrollToBottom, 100);
                  }}
                />
              </div>
            </>
          ) : (
            <>
              {/* Category Picker */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-0.5 block">
                  分类
                </label>
                <SelectPicker
                  value={categoryId}
                  onChange={setCategoryId}
                  options={filteredCategories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    iconName: c.iconName,
                    color: c.color,
                  }))}
                  placeholder="选择分类..."
                  onToggle={(isOpen) => {
                    if (isOpen) setTimeout(scrollToBottom, 100);
                  }}
                />
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
                    if (isOpen) setTimeout(scrollToBottom, 100);
                  }}
                />
              </div>
            </>
          )}

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
            onClick={onClose}
            className="flex-1 py-2 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors cursor-pointer text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors cursor-pointer text-sm"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};
