
import React, { useMemo, useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { useStore } from '../store';
import { useAuthStore } from '../store/authStore';
import * as api from '../lib/api';
import { Channel } from '../types';
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

// Sortable channel card component
const SortableChannelCard: React.FC<{
  channel: Channel;
  balance: number;
  isEditMode: boolean;
  isDragging: boolean;
}> = ({ channel, balance, isEditMode, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useSortable({
    id: channel.id,
    transition: {
      duration: 400,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 300ms cubic-bezier(0.2, 0, 0, 1), box-shadow 300ms ease, opacity 300ms ease',
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.2 : 1,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? attributes : {})}
      {...(isEditMode ? listeners : {})}
      className={`bg-white rounded-xl p-3 border transition-all duration-200 ${isEditMode ? 'touch-none' : ''} ${
        isEditMode
          ? 'border-blue-300 shadow-md hover:shadow-lg cursor-grab active:cursor-grabbing'
          : 'border-slate-100 shadow-sm hover:shadow-md'
      } ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
          style={{ backgroundColor: channel.color }}
        >
          <Icon name={channel.iconName as any} size={14} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-xs truncate">{channel.name}</h3>
        </div>
      </div>
      <div>
        <span className="text-slate-400 text-[10px]">余额</span>
        <div className={`text-base font-bold ${balance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
          ¥{formatCurrency(balance)}
        </div>
      </div>
    </div>
  );
};

export const SavingsPage: React.FC = () => {
  const { records, channels, categories, hasInitializedSavings, setHasInitializedSavings, addRecord, reorderChannels, getChannelBalance, updateChannelBalances, initData } = useStore();
  const { isAuthenticated } = useAuthStore();
  const [showInitModal, setShowInitModal] = useState(false);
  const [initialBalances, setInitialBalances] = useState<Record<string, string>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // 检查是否需要从数据库刷新渠道数据
  useEffect(() => {
    const hasOldFormatChannels = channels.some(c => c.id.match(/^ch\d+$/));
    if (isAuthenticated && hasOldFormatChannels) {
      console.log('Detected old format channels, refreshing from database...');
      initData();
    }
  }, [isAuthenticated]);

  // 检查是否需要显示初始化弹窗
  // 条件：已登录、渠道已加载、且所有渠道余额都为0或未设置
  const needsInitialization = useMemo(() => {
    if (!isAuthenticated) return false;
    if (channels.length === 0) return false;

    // 检查是否所有渠道都没有设置余额
    const allZero = channels.every(c => {
      const balance = getChannelBalance(c.id);
      return balance === 0;
    });
    return allZero;
  }, [isAuthenticated, channels, records, getChannelBalance]);

  useEffect(() => {
    if (needsInitialization) {
      setShowInitModal(true);
      const initial: Record<string, string> = {};
      channels.forEach(c => initial[c.name] = '');
      setInitialBalances(initial);
    }
  }, [needsInitialization, channels]);

  const handleInitSubmit = async () => {
    console.log('Initial balances:', initialBalances);
    console.log('Channels:', channels);
    setIsInitializing(true);
    try {
      const authState = useAuthStore.getState();
      const userId = authState.currentUser?.id;

      // 从当前分类中查找收入和支出分类
      const incomeCategory = categories.find(c => c.type === 'income');
      const expenseCategory = categories.find(c => c.type === 'expense');
      const incomeSubCategory = incomeCategory?.subCategories?.[0];
      const expenseSubCategory = expenseCategory?.subCategories?.[0];

      if (!incomeCategory || !expenseCategory || !incomeSubCategory || !expenseSubCategory) {
        throw new Error('分类数据未加载');
      }

      // 所有用户都使用交易记录方式初始化余额（保持一致性）
      // 正数创建收入记录，负数创建支出记录
      const promises = channels.map((channel) => {
        const amountStr = initialBalances[channel.id] || initialBalances[channel.name] || '';
        const amount = parseFloat(amountStr as string);
        if (!isNaN(amount) && amount !== 0) {
          return addRecord({
            amount: Math.abs(amount),
            categoryId: amount > 0 ? incomeCategory.id : expenseCategory.id,
            subCategoryId: amount > 0 ? incomeSubCategory.id : expenseSubCategory.id,
            channelId: channel.id,
            type: amount > 0 ? 'income' : 'expense',
            date: new Date().toISOString(),
            note: '初始余额',
            isInitialBalance: true
          });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);

      setHasInitializedSavings(true);
      setShowInitModal(false);
    } catch (error) {
      console.error('Init submit error:', error);
      alert('保存失败: ' + (error as Error).message);
    } finally {
      setIsInitializing(false);
    }
  };

  // 始终从交易记录计算余额，确保实时更新
  const channelBalances = useMemo(() => {
    const balances = new Map<string, number>();
    channels.forEach(c => {
      balances.set(c.id, getChannelBalance(c.id));
    });
    return balances;
  }, [channels, records, getChannelBalance]);

  const totalAssets = Array.from(channelBalances.values()).reduce((acc: number, curr: number) => acc + curr, 0) as number;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // dnd-kit sensors - 只在编辑模式下激活 PointerSensor，非编辑模式使用很大的 distance 使其无法触发
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isEditMode ? 5 : 9999,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      const oldIndex = channels.findIndex((c) => c.id === active.id);
      const newIndex = channels.findIndex((c) => c.id === over.id);
      reorderChannels(oldIndex, newIndex);
    }
  };

  return (
    <Layout activeTab="savings" title="储蓄目标">
      <div className="max-w-6xl mx-auto relative pb-6">

        {/* Total Assets Card */}
        <div className="rounded-2xl p-4 md:p-6 text-white shadow-lg mb-6" style={{ backgroundColor: '#0284C7' }}>
          <span className="text-white text-xs md:text-sm font-medium uppercase tracking-wider">总资产</span>
          <div className="text-2xl md:text-4xl font-bold mt-1 md:mt-2">
            ¥{formatCurrency(totalAssets)}
          </div>
        </div>

        {/* Channel Grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">账户列表</h2>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="text-xs font-medium text-slate-700 hover:text-slate-800 cursor-pointer px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg"
          >
            {isEditMode ? '完成' : '编辑'}
          </button>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={isEditMode ? channels.map(c => c.id) : []}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {channels.map((channel) => {
                const balance = channelBalances.get(channel.id) || 0;
                const isDragging = activeId === channel.id;
                return (
                  <SortableChannelCard
                    key={channel.id}
                    channel={channel}
                    balance={balance}
                    isEditMode={isEditMode}
                    isDragging={isDragging}
                  />
                );
              })}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="bg-white rounded-xl p-3 border-2 border-blue-500">
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: channels.find(c => c.id === activeId)?.color }}
                  >
                    <Icon name={channels.find(c => c.id === activeId)?.iconName as any} size={14} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-xs truncate">{channels.find(c => c.id === activeId)?.name}</h3>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">余额</span>
                  <div className={`text-base font-bold ${(channelBalances.get(activeId) || 0) < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                    ¥{formatCurrency(channelBalances.get(activeId) || 0)}
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Initialization Modal */}
        {showInitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">初始化账户余额</h2>
                <p className="text-slate-500 text-sm mt-1">请填写各账户的当前余额，以便我们为您提供准确的资产统计。</p>
              </div>
              
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: channel.color }}
                    >
                      <Icon name={channel.iconName} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 mb-1">{channel.name}</div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">¥</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={initialBalances[channel.name] || ''}
                          onChange={(e) => setInitialBalances(prev => ({ ...prev, [channel.name]: e.target.value }))}
                          className="w-full pl-6 pr-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button
                  onClick={() => setShowInitModal(false)}
                  disabled={isInitializing}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  暂不设置
                </button>
                <button
                  onClick={handleInitSubmit}
                  disabled={isInitializing}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInitializing ? '保存中...' : '确认并开始'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
