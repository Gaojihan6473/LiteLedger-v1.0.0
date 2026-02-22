import { supabase } from './supabase';
import { convertDbTransactionToRecord, convertDbCategoryToCategory, convertDbChannelToChannel } from './supabase';
import type { TransactionRecord, Category, Channel } from '../types';

// 存储所有活跃的订阅
let subscriptions: Array<{ channel: ReturnType<typeof supabase.channel>; unsubscribe: () => void }> = [];

/**
 * 监听交易记录变化
 */
export const subscribeToTransactions = (
  userId: string,
  callbacks: {
    onInsert?: (record: TransactionRecord) => void;
    onUpdate?: (record: TransactionRecord) => void;
    onDelete?: (id: string) => void;
  }
) => {
  const channel = supabase
    .channel(`transactions:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const record = convertDbTransactionToRecord(payload.new as any);
        callbacks.onInsert?.(record);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const record = convertDbTransactionToRecord(payload.new as any);
        callbacks.onUpdate?.(record);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const id = (payload.old as any).id;
        callbacks.onDelete?.(id);
      }
    )
    .subscribe();

  const subscription = { channel, unsubscribe: () => channel.unsubscribe() };
  subscriptions.push(subscription);

  return subscription;
};

/**
 * 监听分类变化
 */
export const subscribeToCategories = (
  userId: string,
  callbacks: {
    onInsert?: (category: Category) => void;
    onUpdate?: (category: Category) => void;
    onDelete?: (id: string) => void;
  }
) => {
  const channel = supabase
    .channel(`categories:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'categories',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // 获取子分类
        const { data } = await supabase
          .from('categories')
          .select('*, sub_categories(*)')
          .eq('id', (payload.new as any).id)
          .single();
        const category = convertDbCategoryToCategory(data as any);
        callbacks.onInsert?.(category);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'categories',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        const { data } = await supabase
          .from('categories')
          .select('*, sub_categories(*)')
          .eq('id', (payload.new as any).id)
          .single();
        const category = convertDbCategoryToCategory(data as any);
        callbacks.onUpdate?.(category);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'categories',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const id = (payload.old as any).id;
        callbacks.onDelete?.(id);
      }
    )
    .subscribe();

  const subscription = { channel, unsubscribe: () => channel.unsubscribe() };
  subscriptions.push(subscription);

  return subscription;
};

/**
 * 监听渠道变化
 */
export const subscribeToChannels = (
  userId: string,
  callbacks: {
    onInsert?: (channel: Channel) => void;
    onUpdate?: (channel: Channel) => void;
    onDelete?: (id: string) => void;
  }
) => {
  const channel = supabase
    .channel(`channels:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'channels',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const channel = convertDbChannelToChannel(payload.new as any);
        callbacks.onInsert?.(channel);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'channels',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const channel = convertDbChannelToChannel(payload.new as any);
        callbacks.onUpdate?.(channel);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'channels',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const id = (payload.old as any).id;
        callbacks.onDelete?.(id);
      }
    )
    .subscribe();

  const subscription = { channel, unsubscribe: () => channel.unsubscribe() };
  subscriptions.push(subscription);

  return subscription;
};

/**
 * 取消所有订阅
 */
export const unsubscribeAll = () => {
  subscriptions.forEach(({ unsubscribe }) => {
    unsubscribe();
  });
  subscriptions = [];
};

/**
 * 获取当前活跃的订阅数量
 */
export const getSubscriptionCount = () => subscriptions.length;
