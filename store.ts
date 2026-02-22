import { create } from 'zustand';
import { Category, TransactionRecord, Channel } from './types';
import { useAuthStore } from './store/authStore';
import * as api from './lib/api';
import {
  subscribeToTransactions,
  subscribeToCategories,
  subscribeToChannels,
  unsubscribeAll,
} from './lib/realtime';

interface AppState {
  categories: Category[];
  channels: Channel[];
  records: TransactionRecord[];
  hasInitializedSavings: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // 初始化 - 从 Supabase 加载数据并设置 Realtime 订阅
  initData: () => Promise<void>;

  setHasInitializedSavings: (value: boolean) => void;

  // 交易记录操作
  addRecord: (record: Omit<TransactionRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  updateRecord: (id: string, updates: Partial<TransactionRecord>) => Promise<void>;
  getChannelBalance: (channelId: string) => number;
  getFilteredRecords: () => TransactionRecord[];

  // 分类操作
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  deleteSubCategory: (categoryId: string, subCategoryId: string) => Promise<void>;
  reorderCategories: (type: 'expense' | 'income', fromIndex: number, toIndex: number) => Promise<void>;

  // 渠道操作
  addChannel: (channel: Omit<Channel, 'id'>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  reorderChannels: (fromIndex: number, toIndex: number) => Promise<void>;

  // 更新渠道余额
  updateChannelBalances: (updates: Array<{ id: string; balance: number }>) => Promise<void>;

  // 数据管理
  clearAllData: () => Promise<void>;
  cleanup: () => void;
}

export const useStore = create<AppState>()(
  (set, get) => ({
    // 初始值为空，等待从 Supabase 加载
    categories: [],
    channels: [],
    records: [],
    hasInitializedSavings: false,
    isLoading: false,
    isSyncing: false,
    error: null,

    initData: async () => {
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.currentUser) {
        return;
      }

      const userId = authState.currentUser.id;

      // 清理旧的订阅
      unsubscribeAll();

      set({ isLoading: true, error: null });

      try {
        // 并行加载所有数据
        const [categories, channels, records] = await Promise.all([
          api.fetchCategories(userId),
          api.fetchChannels(userId),
          api.fetchTransactions(userId),
        ]);

        // 去重函数
        const deduplicate = <T extends { id: string }>(items: T[]): T[] => {
          const seen = new Set<string>();
          return items.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        };

        const uniqueCategories = deduplicate(categories);
        const uniqueChannels = deduplicate(channels);

        // 如果没有分类数据，初始化默认数据
        if (uniqueCategories.length === 0) {
          await api.initDefaultData(userId);
          const newCategories = await api.fetchCategories(userId);
          const newChannels = await api.fetchChannels(userId);
          set({
            categories: deduplicate(newCategories),
            channels: deduplicate(newChannels),
            records: [],
            isLoading: false,
          });
        } else {
          set({
            categories: uniqueCategories,
            channels: uniqueChannels,
            records,
            isLoading: false,
          });
        }

        // 设置 Realtime 订阅
        subscribeToTransactions(userId, {
          onInsert: (record) => {
            set((state) => ({
              records: [record, ...state.records],
            }));
          },
          onUpdate: (record) => {
            set((state) => ({
              records: state.records.map((r) => (r.id === record.id ? record : r)),
            }));
          },
          onDelete: (id) => {
            set((state) => ({
              records: state.records.filter((r) => r.id !== id),
            }));
          },
        });

        subscribeToCategories(userId, {
          onInsert: (category) => {
            set((state) => ({
              categories: [...state.categories, category],
            }));
          },
          onUpdate: (category) => {
            set((state) => ({
              categories: state.categories.map((c) => (c.id === category.id ? category : c)),
            }));
          },
          onDelete: (id) => {
            set((state) => ({
              categories: state.categories.filter((c) => c.id !== id),
            }));
          },
        });

        subscribeToChannels(userId, {
          onInsert: (channel) => {
            set((state) => ({
              channels: [...state.channels, channel],
            }));
          },
          onUpdate: (channel) => {
            set((state) => ({
              channels: state.channels.map((c) => (c.id === channel.id ? channel : c)),
            }));
          },
          onDelete: (id) => {
            set((state) => ({
              channels: state.channels.filter((c) => c.id !== id),
            }));
          },
        });
      } catch (error: any) {
        console.error('Init data error:', error);
        set({ error: error.message, isLoading: false });
      }
    },

    setHasInitializedSavings: (value) => set({ hasInitializedSavings: value }),

    // 交易记录操作 - 先更新 Supabase，成功后再更新本地状态
    addRecord: async (newRecord) => {
      const authState = useAuthStore.getState();
      const userId = authState.currentUser?.id;

      console.log('addRecord called, userId:', userId, 'authState:', authState);

      if (!userId) {
        throw new Error('请先登录后再进行记账');
      }

      // 先更新 Supabase
      const dbRecord = await api.addTransaction(userId, newRecord);

      console.log('addRecord result:', dbRecord);

      // 成功后再更新本地状态
      set((state) => ({
        records: [dbRecord, ...state.records],
      }));
    },

    deleteRecord: async (id) => {
      // 先更新 Supabase
      await api.deleteTransaction(id);

      // 成功后再更新本地状态
      set((state) => ({
        records: state.records.filter((r) => r.id !== id),
      }));
    },

    updateRecord: async (id, updates) => {
      // 先更新 Supabase
      await api.updateTransaction(id, updates);

      // 成功后再更新本地状态
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
    },

    getChannelBalance: (channelId) => {
      const { records } = get();
      return records
        .filter((r) => r.channelId === channelId)
        .reduce((sum, r) => {
          if (r.type === 'expense') return sum - r.amount;
          if (r.type === 'income') return sum + r.amount;
          if (r.type === 'transfer') {
            return sum + r.amount;
          }
          return sum;
        }, 0);
    },

    getFilteredRecords: () => {
      const { records } = get();
      return records.filter((r) => !r.isInitialBalance);
    },

    // 分类操作 - 先更新 Supabase，成功后再更新本地状态
    addCategory: async (category) => {
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = authState.currentUser.id;

      // 先更新 Supabase
      const dbCategory = await api.addCategory(userId, category);

      // 成功后再更新本地状态
      set((state) => ({
        categories: [...state.categories, dbCategory],
      }));
    },

    deleteCategory: async (id) => {
      // 先更新 Supabase
      await api.deleteCategory(id);

      // 成功后再更新本地状态
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      }));
    },

    deleteSubCategory: async (categoryId, subCategoryId) => {
      // 先更新 Supabase
      await api.deleteSubCategory(subCategoryId);

      // 成功后再更新本地状态
      set((state) => ({
        categories: state.categories.map((c) => {
          if (c.id === categoryId && c.subCategories) {
            return {
              ...c,
              subCategories: c.subCategories.filter((sub) => sub.id !== subCategoryId),
            };
          }
          return c;
        }),
      }));
    },

    reorderCategories: async (type, fromIndex, toIndex) => {
      const { categories } = get();
      const typeCategories = categories.filter((c) => c.type === type);
      const otherCategories = categories.filter((c) => c.type !== type);

      const reordered = [...typeCategories];
      const [removed] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, removed);

      const newCategories = [...otherCategories, ...reordered];

      // 先立即更新本地状态（用户立即看到效果）
      set({ categories: newCategories });

      // 再异步更新数据库（不等待）
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated && authState.currentUser) {
        api.reorderCategoriesDb(authState.currentUser.id, newCategories).catch(err => console.error('Reorder categories failed:', err));
      }
    },

    // 渠道操作 - 先更新 Supabase，成功后再更新本地状态
    addChannel: async (channel) => {
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.currentUser) {
        throw new Error('User not authenticated');
      }

      const userId = authState.currentUser.id;

      // 先更新 Supabase
      const dbChannel = await api.addChannel(userId, channel);

      // 成功后再更新本地状态
      set((state) => ({
        channels: [...state.channels, dbChannel],
      }));
    },

    deleteChannel: async (id) => {
      // 先更新 Supabase
      await api.deleteChannel(id);

      // 成功后再更新本地状态
      set((state) => ({
        channels: state.channels.filter((c) => c.id !== id),
      }));
    },

    reorderChannels: async (fromIndex, toIndex) => {
      const { channels } = get();
      const reordered = [...channels];
      const [removed] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, removed);

      const newChannels = reordered;

      // 先立即更新本地状态（用户立即看到效果）
      set({ channels: newChannels });

      // 再异步更新数据库（不等待）
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated && authState.currentUser) {
        api.reorderChannelsDb(authState.currentUser.id, newChannels).catch(err => console.error('Reorder channels failed:', err));
      }
    },

    // 更新渠道余额 - 批量更新
    updateChannelBalances: async (updates: Array<{ id: string; balance: number }>) => {
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.currentUser) {
        throw new Error('User not authenticated');
      }

      // 先更新 Supabase
      await api.batchUpdateChannelBalances(updates);

      // 成功后再更新本地状态
      set((state) => ({
        channels: state.channels.map((ch) => {
          const update = updates.find((u) => u.id === ch.id);
          return update ? { ...ch, balance: update.balance } : ch;
        }),
      }));
    },

    // 数据管理 - 清除本地状态和 Supabase 数据（保留默认分类和渠道）
    clearAllData: async () => {
      const authState = useAuthStore.getState();

      // 如果用户已登录，清除 Supabase 中的交易记录和自定义分类
      if (authState.isAuthenticated && authState.currentUser) {
        try {
          await api.clearAllUserData(authState.currentUser.id);
        } catch (error) {
          console.error('Clear Supabase data error:', error);
        }
      }

      // 清除本地状态 - 只清空交易记录，保留分类和渠道
      set({
        records: [],
        hasInitializedSavings: false,
        // categories 和 channels 保持不变
      });
    },

    // 清理函数 - 取消订阅
    cleanup: () => {
      unsubscribeAll();
    },
  })
);
