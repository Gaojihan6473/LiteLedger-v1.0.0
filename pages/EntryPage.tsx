
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { DatePicker } from '../components/DatePicker';
import { SelectPicker } from '../components/SelectPicker';
import { AIVoiceRecordingModal } from '../components/AIVoiceRecordingModal';
import { useStore } from '../store';
import { TransactionType, Category, Channel } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable category item component
const SortableCategoryItem: React.FC<{
  category: Category;
  isSelected: boolean;
  isCurrentlyDragging: boolean;
  onSelect: () => void;
  isEditMode?: boolean;
  onDelete?: () => void;
}> = ({ category, isSelected, isCurrentlyDragging, onSelect, isEditMode, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : undefined,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? attributes : {})}
      {...(isEditMode ? listeners : {})}
      onClick={onSelect}
      className={`group flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all ${isEditMode ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-pointer'} relative ${
        isEditMode
          ? ''
          : isDragging
            ? isSelected
              ? 'bg-blue-50 ring-2 ring-blue-600 ring-offset-2 shadow-sm'
              : ''
            : isSelected
              ? 'bg-blue-50 ring-2 ring-blue-600 ring-offset-2 shadow-sm'
              : 'hover:bg-slate-50'
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
          isEditMode ? '' : isSelected ? 'scale-110 shadow-lg' : 'group-hover:scale-105'
        } relative`}
        style={{
          backgroundColor: isEditMode ? '#F1F5F9' : isSelected ? category.color : '#F1F5F9',
          color: isEditMode ? '#64748B' : isSelected ? '#FFFFFF' : '#64748B'
        }}
      >
        {isEditMode && onDelete && (
          <button
            onClick={handleDeleteClick}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-400 text-white flex items-center justify-center z-10 cursor-pointer"
          >
            <Icon name="X" size={12} />
          </button>
        )}
        <Icon name={category.iconName as any} size={22} />
      </div>
      <span className={`text-xs font-medium truncate w-full text-center mt-1.5 ${
        isEditMode ? 'text-slate-500' : isSelected ? 'text-blue-900' : 'text-slate-500 group-hover:text-slate-700'
      }`}>
        {category.name}
      </span>
    </div>
  );
};

export const EntryPage: React.FC = () => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  // 转账相关状态
  const [fromChannelId, setFromChannelId] = useState<string>('');
  const [toChannelId, setToChannelId] = useState<string>('');
  // 获取本地日期字符串（避免 UTC 时区问题）
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<string>(getLocalDateString());
  const [note, setNote] = useState<string>('');

  // 每次组件挂载时，重置日期为当天
  useEffect(() => {
    setDate(getLocalDateString());
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { categories, channels, addRecord, addCategory, deleteCategory, deleteSubCategory, reorderCategories, getChannelBalance } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAIVoiceModal, setShowAIVoiceModal] = useState(false);

  // 处理 AI 语音记账确认
  const handleAIConfirm = (data: {
    type: TransactionType;
    amount: string;
    date: string;
    categoryId: string;
    subCategoryId?: string;
    channelId: string;
    fromChannelId?: string;  // 转账转出账户
    toChannelId?: string;    // 转账转入账户
    note: string;
  }) => {
    // 填充表单
    setType(data.type);
    setAmount(data.amount);
    setDate(data.date);
    setSelectedCategoryId(data.categoryId);
    setSelectedSubCategoryId(data.subCategoryId || '');
    setSelectedChannelId(data.channelId);

    // 转账类型使用 fromChannelId 和 toChannelId
    if (data.type === 'transfer') {
      setFromChannelId(data.fromChannelId || '');
      setToChannelId(data.toChannelId || '');
    } else {
      setFromChannelId('');
      setToChannelId('');
    }

    setNote(data.note);

    // 关闭弹窗
    setShowAIVoiceModal(false);
  };

  const filteredCategories = categories.filter(c => c.type === type);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id && type !== 'transfer') {
      const oldIndex = filteredCategories.findIndex((c) => c.id === active.id);
      const newIndex = filteredCategories.findIndex((c) => c.id === over.id);
      reorderCategories(type as 'expense' | 'income', oldIndex, newIndex);
    }
  };
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // 获取不包含指定账户的渠道列表（用于转账时排除已选账户）
  const getAvailableChannels = (excludeId?: string): Channel[] => {
    return channels.filter(c => c.id !== excludeId);
  };

  // 计算转账后账户余额
  const getTransferPreview = () => {
    if (!fromChannelId || !toChannelId || !amount || parseFloat(amount) <= 0) return null;
    const transferAmount = parseFloat(amount);
    const fromBalance = getChannelBalance(fromChannelId);
    const toBalance = getChannelBalance(toChannelId);
    return {
      fromBalance: fromBalance - transferAmount,
      toBalance: toBalance + transferAmount,
      hasEnough: fromBalance >= transferAmount
    };
  };

  // 转账时验证表单
  const isTransferFormValid = () => {
    if (!amount || parseFloat(amount) <= 0) return false;
    if (!fromChannelId || !toChannelId) return false;
    if (fromChannelId === toChannelId) return false;
    const preview = getTransferPreview();
    if (!preview || !preview.hasEnough) return false;
    return true;
  };

  // Reset sub-category and note when category changes
  useEffect(() => {
    setSelectedSubCategoryId('');
    setNote('');
  }, [selectedCategoryId]);

  // Sync sub-category name to note
  useEffect(() => {
    if (selectedSubCategoryId && selectedCategory?.subCategories) {
      const sub = selectedCategory.subCategories.find(s => s.id === selectedSubCategoryId);
      if (sub) {
        setNote(sub.name);
      }
    }
  }, [selectedSubCategoryId, selectedCategory]);

  const handleSubmit = async () => {
    try {
      // 转账逻辑
      if (type === 'transfer') {
        if (!isTransferFormValid()) return;

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 600));

        const transferAmount = parseFloat(amount);

        const userNote = note.trim();
        const fromChannelName = channels.find(c => c.id === fromChannelId)?.name || '';
        const toChannelName = channels.find(c => c.id === toChannelId)?.name || '';

        // 从用户分类中查找转账分类
        const transferCategory = categories.find(c => c.type === 'transfer');
        const transferInSub = transferCategory?.subCategories?.find(sc => sc.name === '转入');
        const transferOutSub = transferCategory?.subCategories?.find(sc => sc.name === '转出');

        if (!transferCategory || !transferInSub || !transferOutSub) {
          alert('转账分类未加载，请稍后重试');
          setIsSubmitting(false);
          return;
        }

        // 创建转出记录 - 存储为负数（支出）
        await addRecord({
          amount: -transferAmount,
          categoryId: transferCategory.id,
          subCategoryId: transferOutSub.id,
          channelId: fromChannelId,
          type: 'transfer',
          date: new Date(date).toISOString(),
          note: userNote ? `转出至${toChannelName}-${userNote}` : `转出至${toChannelName}`
        });

        // 创建转入记录 - 存储为正数（收入）
        await addRecord({
          amount: transferAmount,
          categoryId: transferCategory.id,
          subCategoryId: transferInSub.id,
          channelId: toChannelId,
          type: 'transfer',
          date: new Date(date).toISOString(),
          note: userNote ? `从${fromChannelName}转入-${userNote}` : `从${fromChannelName}转入`
        });

        // Reset form
        setAmount('');
        setNote('');
        setFromChannelId('');
        setToChannelId('');
        setIsSubmitting(false);

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      // 支出/收入逻辑
      if (!amount || parseFloat(amount) <= 0 || !selectedCategoryId || !selectedChannelId) return;

      setIsSubmitting(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));

      await addRecord({
        amount: parseFloat(amount),
        categoryId: selectedCategoryId,
        subCategoryId: selectedSubCategoryId || undefined,
        channelId: selectedChannelId,
        type,
        date: new Date(date).toISOString(),
        note: note.trim()
      });

      // Reset form
      setAmount('');
      setNote('');
      setSelectedCategoryId('');
      setSelectedSubCategoryId('');
      // We can keep the selected channel as users often use the same one, or reset it.
      setSelectedChannelId('');
      setIsSubmitting(false);

      // Show toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Submit error:', error);
      setIsSubmitting(false);
      alert('保存失败: ' + (error as Error).message);
    }
  };

  const isFormValid = type === 'transfer'
    ? isTransferFormValid()
    : amount.length > 0 && parseFloat(amount) > 0 && selectedCategoryId.length > 0 && selectedChannelId.length > 0;

  const handleAddCategory = (category: {
    name: string;
    iconName: string;
    type: TransactionType;
    color: string;
    subCategories?: { id: string; name: string }[];
  }) => {
    addCategory(category);
    setShowAddModal(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('确定要删除该分类吗？')) {
      deleteCategory(categoryId);
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId('');
        setSelectedSubCategoryId('');
      }
    }
  };

  const handleDeleteSubCategory = (categoryId: string, subCategoryId: string) => {
    if (confirm('确定要删除该二级分类吗？')) {
      deleteSubCategory(categoryId, subCategoryId);
      if (selectedSubCategoryId === subCategoryId) {
        setSelectedSubCategoryId('');
      }
    }
  };

  const typeLabels = {
    expense: '支出',
    income: '收入',
    transfer: '转账'
  };

  return (
    <Layout activeTab="entry" title="记账" showAIVoiceButton={true} onAIVoiceClick={() => setShowAIVoiceModal(true)}>
      <div className="max-w-6xl mx-auto md:h-[calc(100vh-6rem)] flex flex-col pb-6 md:pb-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full">
          
          {/* Left Panel: Inputs */}
          <div className="md:col-span-5 lg:col-span-5 flex flex-col h-full">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1">
              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                {(['expense', 'income', 'transfer'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setType(t);
                      setSelectedCategoryId('');
                      if (t !== 'transfer') {
                        setFromChannelId('');
                        setToChannelId('');
                      }
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      type === t
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>

              {/* Form Fields */}
              <div className="flex-1">
              {/* Amount Input */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                  金额
                </label>
                <div className="relative group">
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold transition-colors ${type === 'expense' ? 'text-slate-900' : type === 'income' ? 'text-green-600' : 'text-purple-600'}`}>
                    ¥
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className={`w-full bg-transparent text-4xl font-bold outline-none pl-6 py-1 border-b-2 border-slate-100 focus:border-blue-500 transition-colors placeholder-slate-200 ${type === 'expense' ? 'text-slate-900' : type === 'income' ? 'text-green-600' : 'text-purple-600'}`}
                    autoFocus
                  />
                </div>
              </div>

              {/* Date, Channel & Note */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    日期
                  </label>
                  <DatePicker value={date} onChange={setDate} />
                </div>

                {/* 支出/收入的渠道选择 */}
                {type !== 'transfer' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                      渠道 <span className="text-red-500">*</span>
                    </label>
                    <SelectPicker
                      value={selectedChannelId}
                      onChange={setSelectedChannelId}
                      options={channels}
                      placeholder="选择资金账户..."
                    />
                  </div>
                )}

                {/* 转账的转出/转入账户选择 */}
                {type === 'transfer' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        转出账户 <span className="text-red-500">*</span>
                      </label>
                      <SelectPicker
                        value={fromChannelId}
                        onChange={(id) => {
                          setFromChannelId(id);
                          if (id === toChannelId) {
                            setToChannelId('');
                          }
                        }}
                        options={getAvailableChannels(toChannelId || undefined)}
                        placeholder="选择转出账户..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        转入账户 <span className="text-red-500">*</span>
                      </label>
                      <SelectPicker
                        value={toChannelId}
                        onChange={(id) => {
                          setToChannelId(id);
                          if (id === fromChannelId) {
                            setFromChannelId('');
                          }
                        }}
                        options={getAvailableChannels(fromChannelId || undefined)}
                        placeholder="选择转入账户..."
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    备注 <span className="text-slate-300 font-normal">(选填)</span>
                  </label>
                  <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="输入备注..."
                      className="w-full h-10 px-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm text-slate-700 placeholder-slate-400 hover:border-slate-300 transition-colors"
                    />
                </div>
              </div>
              </div>

              {/* Submit Button */}
              <Button
                fullWidth
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className="h-12 text-base"
              >
                {isSubmitting ? '保存中...' : type === 'transfer' ? '确认转账' : '确认记账'}
              </Button>
            </div>
          </div>

          {/* Right Panel: Categories or Transfer Info */}
          <div className="md:col-span-7 lg:col-span-7">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-full overflow-y-auto">
              {/* 转账模式显示转账记录预览 */}
              {type === 'transfer' ? (
                <div>
                  <div className="mb-4">
                    <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                      转账预览
                    </label>
                  </div>

                  {fromChannelId && toChannelId && amount && parseFloat(amount) > 0 ? (
                    <div className="space-y-4">
                      {/* 转出账户卡片 */}
                      <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-red-500 font-medium">转出账户</span>
                          <Icon name="ArrowRight" size={18} className="text-red-400" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
                            style={{ backgroundColor: channels.find(c => c.id === fromChannelId)?.color }}
                          >
                            <Icon name={channels.find(c => c.id === fromChannelId)?.iconName as any} size={20} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm truncate">{channels.find(c => c.id === fromChannelId)?.name}</h3>
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-slate-400 text-xs">转账前余额</span>
                            <div className="text-sm font-medium text-slate-600">
                              ¥{formatCurrency(getChannelBalance(fromChannelId))}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-xs">转账后余额</span>
                            <div className={`text-xl font-bold ${getTransferPreview()?.hasEnough ? 'text-slate-900' : 'text-red-500'}`}>
                              ¥{formatCurrency(getTransferPreview()?.fromBalance || 0)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 转账箭头和金额 */}
                      <div className="flex items-center justify-center gap-4 py-2">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-300 to-transparent"></div>
                        <div className="flex flex-col items-center px-4">
                          <Icon name="ArrowDown" size={24} className="text-purple-500 mb-1" />
                          <span className="text-lg font-bold text-purple-600">¥{formatCurrency(parseFloat(amount))}</span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-300 to-transparent"></div>
                      </div>

                      {/* 转入账户卡片 */}
                      <div className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-green-500 font-medium">转入账户</span>
                          <Icon name="ArrowLeft" size={18} className="text-green-400" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
                            style={{ backgroundColor: channels.find(c => c.id === toChannelId)?.color }}
                          >
                            <Icon name={channels.find(c => c.id === toChannelId)?.iconName as any} size={20} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm truncate">{channels.find(c => c.id === toChannelId)?.name}</h3>
                          </div>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="text-slate-400 text-xs">转账前余额</span>
                            <div className="text-sm font-medium text-slate-600">
                              ¥{formatCurrency(getChannelBalance(toChannelId))}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-xs">转账后余额</span>
                            <div className="text-xl font-bold text-slate-900">
                              ¥{formatCurrency(getTransferPreview()?.toBalance || 0)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 余额不足提示 */}
                      {!getTransferPreview()?.hasEnough && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                          <Icon name="AlertCircle" size={16} className="text-red-500" />
                          <span className="text-xs text-red-600">转出账户余额不足</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <Icon name="ArrowLeftRight" size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="text-sm">请选择转出和转入账户</p>
                      <p className="text-xs mt-1">并输入转账金额</p>
                    </div>
                  )}
                </div>
              ) : (
                /* 支出/收入模式显示分类选择 */
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                        选择分类
                      </label>
                      <button
                        onClick={() => {
                          setIsEditMode(!isEditMode);
                          if (!isEditMode) {
                            setIsExpanded(true);
                          } else {
                            setIsExpanded(false);
                          }
                        }}
                        className="text-xs font-medium text-slate-700 hover:text-slate-800 cursor-pointer px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg"
                      >
                        {isEditMode ? '完成' : '编辑'}
                      </button>
                    </div>

                    {/* Sub-category pills */}
                    {selectedCategory?.subCategories && selectedCategory.subCategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {selectedCategory.subCategories.map(sub => (
                          <div key={sub.id} className="relative group">
                            <button
                              onClick={() => !isEditMode && setSelectedSubCategoryId(sub.id === selectedSubCategoryId ? '' : sub.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                selectedSubCategoryId === sub.id
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {sub.name}
                            </button>
                            {isEditMode && (
                              <button
                                onClick={() => handleDeleteSubCategory(selectedCategory.id, sub.id)}
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-400 text-white flex items-center justify-center cursor-pointer"
                              >
                                <Icon name="X" size={10} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-0" />
                    )}
                  </div>

                  <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredCategories.map(c => c.id)}
                  strategy={rectSortingStrategy}
                >
                  {(() => {
                    const MAX_CATEGORIES = 19;
                    const shouldShowExpand = filteredCategories.length > MAX_CATEGORIES;
                    const displayCategories = shouldShowExpand && !isExpanded
                      ? filteredCategories.slice(0, MAX_CATEGORIES)
                      : filteredCategories;

                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {displayCategories.map((cat) => (
                            <SortableCategoryItem
                              key={cat.id}
                              category={cat}
                              isSelected={selectedCategoryId === cat.id}
                              isCurrentlyDragging={activeId === cat.id}
                              onSelect={() => {
                              if (selectedCategoryId === cat.id) {
                                setSelectedCategoryId('');
                              } else {
                                setSelectedCategoryId(cat.id);
                              }
                            }}
                              isEditMode={isEditMode}
                              onDelete={() => handleDeleteCategory(cat.id)}
                            />
                          ))}

                          {/* Add Category Button */}
                          <button
                            onClick={() => !isEditMode && setShowAddModal(true)}
                            className={`group flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all ${isEditMode ? 'pointer-events-none' : 'cursor-pointer hover:bg-slate-50'}`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-400 transition-colors ${isEditMode ? '' : 'group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                              <Icon name="Plus" size={22} />
                            </div>
                            <span className={`text-xs font-medium text-slate-400 transition-colors ${isEditMode ? '' : 'group-hover:text-blue-500'}`}>
                              新增
                            </span>
                          </button>
                        </div>

                        {/* Expand/Collapse Button */}
                        {shouldShowExpand && (
                          <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="block mx-auto text-xs font-medium text-slate-700 hover:text-slate-800 cursor-pointer px-3 py-1.5 border border-slate-200 rounded-lg"
                          >
                            {isExpanded
                              ? '折叠分类'
                              : `已折叠 ${filteredCategories.length - MAX_CATEGORIES} 个分类`}
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <div className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl bg-blue-50 shadow-xl scale-105 ${
                      activeId === selectedCategoryId ? 'ring-2 ring-blue-600 ring-offset-2' : 'ring-2 ring-slate-300 ring-offset-1'
                    }`}>
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{
                          backgroundColor: categories.find(c => c.id === activeId)?.color || '#6366F1',
                          color: '#FFFFFF'
                        }}
                      >
                        <Icon name={categories.find(c => c.id === activeId)?.iconName as any} size={22} />
                      </div>
                      <span className="text-xs font-medium text-blue-900">
                        {categories.find(c => c.id === activeId)?.name}
                      </span>
                    </div>
                  ) : null}
                </DragOverlay>
                </DndContext>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Toast Notification */}
        <div className={`fixed top-6 right-6 md:left-auto md:-translate-x-0 bg-white border border-slate-100 text-slate-900 px-4 py-3 rounded-lg shadow-2xl transition-all duration-500 flex items-center gap-2 z-50 transform ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
          <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-200">
            <Icon name="Plus" size={14} className="text-white" />
          </div>
          <div>
            <h4 className="font-bold text-xs">记账成功</h4>
          </div>
        </div>

        {/* Add Category Modal */}
        <AddCategoryModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCategory}
          defaultType={type}
        />

        {/* AI Voice Recording Modal */}
        <AIVoiceRecordingModal
          isOpen={showAIVoiceModal}
          onClose={() => setShowAIVoiceModal(false)}
          onConfirm={handleAIConfirm}
        />
      </div>
    </Layout>
  );
};
