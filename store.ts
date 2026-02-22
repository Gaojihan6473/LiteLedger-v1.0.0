import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Category, TransactionRecord, Channel } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_CHANNELS } from './constants';
import { useAuthStore } from './store/authStore';
import * as api from './lib/api';

interface AppState {
  categories: Category[];
  channels: Channel[];
  records: TransactionRecord[];
  hasInitializedSavings: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // 初始化 - 从 Supabase 加载数据
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

  // 数据管理
  clearAllData: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 对分类进行去重，避免重复显示
      categories: (() => {
        const seen = new Set<string>();
        return DEFAULT_CATEGORIES.filter(cat => {
          if (seen.has(cat.id)) return false;
          seen.add(cat.id);
          return true;
        });
      })(),
      channels: DEFAULT_CHANNELS,
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
        } catch (error: any) {
          console.error('Init data error:', error);
          set({ error: error.message, isLoading: false });
        }
      },

      setHasInitializedSavings: (value) => set({ hasInitializedSavings: value }),

      // 交易记录操作
      addRecord: async (newRecord) => {
        const authState = useAuthStore.getState();
        const userId = authState.currentUser?.id;

        // 如果有用户ID，尝试保存到服务器
        if (userId) {
          try {
            const dbRecord = await api.addTransaction(userId, newRecord);

            // 更新本地状态
            set((state) => ({
              records: [dbRecord, ...state.records],
            }));
            return;
          } catch (error: any) {
            console.error('Add record to API error:', error);
            // API 失败时fallthrough到本地存储
          }
        }

        // 即使没有认证或 API 失败，也保存到本地状态以便离线使用
        const localRecord = {
          ...newRecord,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        };
        set((state) => ({
          records: [localRecord, ...state.records],
        }));
      },

      deleteRecord: async (id) => {
        try {
          await api.deleteTransaction(id);
          set((state) => ({
            records: state.records.filter((r) => r.id !== id),
          }));
        } catch (error: any) {
          console.error('Delete record error:', error);
          // 即使 API 失败，也从本地删除
          set((state) => ({
            records: state.records.filter((r) => r.id !== id),
          }));
        }
      },

      updateRecord: async (id, updates) => {
        try {
          await api.updateTransaction(id, updates);
          set((state) => ({
            records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
          }));
        } catch (error: any) {
          console.error('Update record error:', error);
          set((state) => ({
            records: state.records.map((r) => (r.id === id ? { ...r, ...updates } : r)),
          }));
        }
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

      // 分类操作
      addCategory: async (category) => {
        const authState = useAuthStore.getState();
        if (!authState.isAuthenticated || !authState.currentUser) {
          throw new Error('User not authenticated');
        }

        const userId = authState.currentUser.id;

        try {
          const dbCategory = await api.addCategory(userId, category);
          set((state) => ({
            categories: [...state.categories, dbCategory],
          }));
        } catch (error: any) {
          console.error('Add category error:', error);
          const localCategory = {
            ...category,
            id: `custom_${crypto.randomUUID()}`,
          };
          set((state) => ({
            categories: [...state.categories, localCategory],
          }));
        }
      },

      deleteCategory: async (id) => {
        try {
          await api.deleteCategory(id);
          set((state) => ({
            categories: state.categories.filter((c) => c.id !== id),
          }));
        } catch (error: any) {
          console.error('Delete category error:', error);
          set((state) => ({
            categories: state.categories.filter((c) => c.id !== id),
          }));
        }
      },

      deleteSubCategory: async (categoryId, subCategoryId) => {
        try {
          await api.deleteSubCategory(subCategoryId);
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
        } catch (error: any) {
          console.error('Delete subcategory error:', error);
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
        }
      },

      reorderCategories: async (type, fromIndex, toIndex) => {
        set((state) => {
          const typeCategories = state.categories.filter((c) => c.type === type);
          const otherCategories = state.categories.filter((c) => c.type !== type);

          const reordered = [...typeCategories];
          const [removed] = reordered.splice(fromIndex, 1);
          reordered.splice(toIndex, 0, removed);

          const newCategories = [...otherCategories, ...reordered];

          // 异步同步到数据库（不阻塞 UI）
          const authState = useAuthStore.getState();
          if (authState.isAuthenticated && authState.currentUser) {
            api.reorderCategoriesDb(authState.currentUser.id, newCategories).catch(console.error);
          }

          return { categories: newCategories };
        });
      },

      // 渠道操作
      addChannel: async (channel) => {
        const authState = useAuthStore.getState();
        if (!authState.isAuthenticated || !authState.currentUser) {
          throw new Error('User not authenticated');
        }

        const userId = authState.currentUser.id;

        try {
          const dbChannel = await api.addChannel(userId, channel);
          set((state) => ({
            channels: [...state.channels, dbChannel],
          }));
        } catch (error: any) {
          console.error('Add channel error:', error);
          const localChannel = {
            ...channel,
            id: `custom_${crypto.randomUUID()}`,
          };
          set((state) => ({
            channels: [...state.channels, localChannel],
          }));
        }
      },

      deleteChannel: async (id) => {
        try {
          await api.deleteChannel(id);
          set((state) => ({
            channels: state.channels.filter((c) => c.id !== id),
          }));
        } catch (error: any) {
          console.error('Delete channel error:', error);
          set((state) => ({
            channels: state.channels.filter((c) => c.id !== id),
          }));
        }
      },

      reorderChannels: async (fromIndex, toIndex) => {
        set((state) => {
          const reordered = [...state.channels];
          const [removed] = reordered.splice(fromIndex, 1);
          reordered.splice(toIndex, 0, removed);

          const newChannels = reordered;

          // 异步同步到数据库
          const authState = useAuthStore.getState();
          if (authState.isAuthenticated && authState.currentUser) {
            api.reorderChannelsDb(authState.currentUser.id, newChannels).catch(console.error);
          }

          return { channels: newChannels };
        });
      },

      // 数据管理
      clearAllData: async () => {
        // 清除本地数据，恢复默认
        set({
          records: [],
          hasInitializedSavings: false,
          categories: DEFAULT_CATEGORIES,
          channels: DEFAULT_CHANNELS,
        });
      },
    }),
    {
      name: 'lite-ledger-storage',
      onRehydrateStorage: () => (state) => {
        // 数据恢复后对分类进行去重
        if (state) {
          const seen = new Set<string>();
          const uniqueCategories = state.categories.filter(cat => {
            if (seen.has(cat.id)) return false;
            seen.add(cat.id);
            return true;
          });
          if (uniqueCategories.length !== state.categories.length) {
            state.categories = uniqueCategories;
          }
        }
      },
      partialize: (state) => ({
        // 存储时也进行去重
        categories: (() => {
          const seen = new Set<string>();
          return state.categories.filter(cat => {
            if (seen.has(cat.id)) return false;
            seen.add(cat.id);
            return true;
          });
        })(),
        channels: state.channels,
        records: state.records,
        hasInitializedSavings: state.hasInitializedSavings,
      }),
    }
  )
);
