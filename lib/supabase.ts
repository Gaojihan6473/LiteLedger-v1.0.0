import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库类型定义
export interface DbProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  user_id: string;
  name: string;
  icon_name: string;
  type: 'expense' | 'income' | 'transfer';
  color?: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  sub_categories?: DbSubCategory[];
}

export interface DbSubCategory {
  id: string;
  category_id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface DbChannel {
  id: string;
  user_id: string;
  name: string;
  icon_name: string;
  color?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbTransaction {
  id: string;
  user_id: string;
  amount: number;
  category_id?: string;
  sub_category_id?: string;
  channel_id?: string;
  type: 'expense' | 'income' | 'transfer';
  date: string;
  note?: string;
  is_initial_balance: boolean;
  created_at: string;
  updated_at: string;
}

// 数据转换函数
export const convertDbCategoryToCategory = (db: DbCategory): any => ({
  id: db.id,
  name: db.name,
  iconName: db.icon_name,
  type: db.type,
  color: db.color,
  sortOrder: db.sort_order,
  isDefault: db.is_default,
  subCategories: db.sub_categories?.map((sc) => ({
    id: sc.id,
    name: sc.name,
  })),
});

export const convertCategoryToDb = (category: any, userId: string): Partial<DbCategory> => ({
  user_id: userId,
  name: category.name,
  icon_name: category.iconName,
  type: category.type,
  color: category.color,
  sort_order: category.sortOrder || 0,
  is_default: category.isDefault || false,
});

export const convertDbChannelToChannel = (db: DbChannel): any => ({
  id: db.id,
  name: db.name,
  iconName: db.icon_name,
  color: db.color,
  sortOrder: db.sort_order,
});

export const convertChannelToDb = (channel: any, userId: string): Partial<DbChannel> => ({
  user_id: userId,
  name: channel.name,
  icon_name: channel.iconName,
  color: channel.color,
  sort_order: channel.sortOrder || 0,
});

export const convertDbTransactionToRecord = (db: DbTransaction): any => ({
  id: db.id,
  amount: db.amount,
  categoryId: db.category_id,
  subCategoryId: db.sub_category_id,
  channelId: db.channel_id,
  type: db.type,
  date: db.date,
  note: db.note,
  createdAt: new Date(db.created_at).getTime(),
  isInitialBalance: db.is_initial_balance,
});

export const convertRecordToDb = (record: any, userId: string): Partial<DbTransaction> => ({
  user_id: userId,
  amount: record.amount,
  category_id: record.categoryId,
  sub_category_id: record.subCategoryId,
  channel_id: record.channelId,
  type: record.type,
  date: record.date.split('T')[0],
  note: record.note,
  is_initial_balance: record.isInitialBalance || false,
});
