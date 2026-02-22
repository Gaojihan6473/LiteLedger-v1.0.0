import { supabase, DbCategory, DbSubCategory, DbChannel, DbTransaction, convertDbCategoryToCategory, convertDbChannelToChannel, convertDbTransactionToRecord, convertCategoryToDb, convertChannelToDb, convertRecordToDb } from './supabase';
import { Category, Channel, TransactionRecord } from '../types';
import type { User } from '../types/auth';

// 超时辅助函数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withTimeout = async (operation: any, ms: number): Promise<any> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return Promise.race([
    operation,
    new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('请求超时')), ms);
    })
  ]).finally(() => clearTimeout(timeoutId));
};

// 获取当前用户
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await withTimeout(() => supabase.auth.getUser(), 3000);
  if (!user) return null;

  let profile = null;
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data;
  } catch (error) {
    // 忽略 406 错误（RLS 策略问题），继续使用默认用户信息
    console.warn('Failed to fetch profile:', error);
  }

  // 如果 profiles 表中没有记录，尝试从 auth.users 获取信息
  if (!profile) {
    // 从 auth.users 构建基本信息
    return {
      id: user.id,
      username: user.email?.split('@')[0] || 'User',
      email: user.email || '',
      password: '',
      createdAt: new Date(user.created_at).getTime(),
    };
  }

  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    password: '', // 不返回密码
    createdAt: new Date(profile.created_at).getTime(),
  };
};

// 根据用户名获取邮箱（用于用户名登录）
export const getEmailByUsername = async (username: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', username)
    .single();

  if (error || !data) return null;
  return data.email;
};

// ============ 分类管理 ============
export const fetchCategories = async (userId: string): Promise<Category[]> => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*, sub_categories(*)')
      .eq('user_id', userId)
      .order('sort_order');

    if (error) {
      console.warn('Fetch categories error:', error);
      return [];
    }
    return (categories || []).map(convertDbCategoryToCategory);
  } catch (error) {
    console.warn('Fetch categories failed:', error);
    return [];
  }
};

export const addCategory = async (userId: string, category: Omit<Category, 'id'>) => {
  const dbData = convertCategoryToDb(category, userId);
  const { data, error } = await supabase
    .from('categories')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return convertDbCategoryToCategory(data);
};

export const updateCategory = async (id: string, updates: Partial<Category>) => {
  const dbUpdates: any = { ...updates };
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.iconName) dbUpdates.icon_name = updates.iconName;
  if (updates.color) dbUpdates.color = updates.color;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('categories')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const reorderCategoriesDb = async (userId: string, categories: Category[]) => {
  const updates = categories.map((cat, index) => ({
    id: cat.id,
    sort_order: index,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('categories')
    .upsert(updates, { onConflict: 'id' });

  if (error) throw error;
};

// ============ 子分类管理 ============
export const addSubCategory = async (categoryId: string, userId: string, name: string) => {
  const { data, error } = await supabase
    .from('sub_categories')
    .insert({ category_id: categoryId, user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSubCategory = async (id: string) => {
  const { error } = await supabase
    .from('sub_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============ 渠道管理 ============
export const fetchChannels = async (userId: string): Promise<Channel[]> => {
  try {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order');

    if (error) {
      console.warn('Fetch channels error:', error);
      return [];
    }
    return (data || []).map(convertDbChannelToChannel);
  } catch (error) {
    console.warn('Fetch channels failed:', error);
    return [];
  }
};

export const addChannel = async (userId: string, channel: Omit<Channel, 'id'>) => {
  const dbData = convertChannelToDb(channel, userId);
  const { data, error } = await supabase
    .from('channels')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return convertDbChannelToChannel(data);
};

export const updateChannel = async (id: string, updates: Partial<Channel>) => {
  const dbUpdates: any = { ...updates };
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.iconName) dbUpdates.icon_name = updates.iconName;
  if (updates.color) dbUpdates.color = updates.color;
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('channels')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
};

export const deleteChannel = async (id: string) => {
  const { error } = await supabase
    .from('channels')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const reorderChannelsDb = async (userId: string, channels: Channel[]) => {
  const updates = channels.map((ch, index) => ({
    id: ch.id,
    sort_order: index,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('channels')
    .upsert(updates, { onConflict: 'id' });

  if (error) throw error;
};

// ============ 交易记录管理 ============
export const fetchTransactions = async (userId: string): Promise<TransactionRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.warn('Fetch transactions error:', error);
      return [];
    }
    return (data || []).map(convertDbTransactionToRecord);
  } catch (error) {
    console.warn('Fetch transactions failed:', error);
    return [];
  }
};

export const addTransaction = async (userId: string, record: Omit<TransactionRecord, 'id' | 'createdAt'>) => {
  const dbData = convertRecordToDb(record, userId);
  const { data, error } = await withTimeout(
    () => supabase.from('transactions').insert(dbData).select().single(),
    3000
  );

  if (error) throw error;
  return convertDbTransactionToRecord(data);
};

export const updateTransaction = async (id: string, updates: Partial<TransactionRecord>) => {
  const dbUpdates: any = { ...updates };
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
  if (updates.subCategoryId !== undefined) dbUpdates.sub_category_id = updates.subCategoryId;
  if (updates.channelId !== undefined) dbUpdates.channel_id = updates.channelId;
  if (updates.type !== undefined) dbUpdates.type = updates.type;
  if (updates.date !== undefined) dbUpdates.date = updates.date.split('T')[0];
  if (updates.note !== undefined) dbUpdates.note = updates.note;
  if (updates.isInitialBalance !== undefined) dbUpdates.is_initial_balance = updates.isInitialBalance;
  dbUpdates.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('transactions')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
};

export const deleteTransaction = async (id: string) => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// ============ 默认数据初始化 ============
export const initDefaultData = async (userId: string) => {
  try {
    // 检查是否已有默认数据
    const { data: existingCategories } = await withTimeout(
      supabase.from('categories').select('id').eq('user_id', userId).limit(1),
      3000
    );

    if (existingCategories && existingCategories.length > 0) {
      return; // 已有数据，不需要初始化
    }

    // 导入默认分类和渠道
    const { DEFAULT_CATEGORIES, DEFAULT_CHANNELS } = await import('../constants');

    // 插入默认分类
    const categoriesToInsert = DEFAULT_CATEGORIES.map((cat: any, index: number) => ({
      user_id: userId,
      name: cat.name,
      icon_name: cat.iconName,
      type: cat.type,
      color: cat.color,
      sort_order: index,
      is_default: true,
    }));

    const { data: insertedCategories, error: catError } = await withTimeout(
      supabase.from('categories').insert(categoriesToInsert).select(),
      3000
    );

    if (catError) throw catError;

    // 插入子分类
    const subCategoriesToInsert: any[] = [];
    DEFAULT_CATEGORIES.forEach((cat: any, catIndex: number) => {
      if (cat.subCategories) {
        const dbCategory = insertedCategories?.find((c, i) => i === catIndex);
        if (dbCategory) {
          cat.subCategories.forEach((sub: any) => {
            subCategoriesToInsert.push({
              category_id: dbCategory.id,
              user_id: userId,
              name: sub.name,
            });
          });
        }
      }
    });

    if (subCategoriesToInsert.length > 0) {
      await withTimeout(
        supabase.from('sub_categories').insert(subCategoriesToInsert),
        3000
      );
    }

    // 插入默认渠道
    const channelsToInsert = DEFAULT_CHANNELS.map((ch: any, index: number) => ({
      user_id: userId,
      name: ch.name,
      icon_name: ch.iconName,
      color: ch.color,
      sort_order: index,
    }));

    const { error: chanError } = await withTimeout(
      supabase.from('channels').insert(channelsToInsert),
      3000
    );

    if (chanError) throw chanError;
  } catch (error) {
    // 静默失败，不阻塞应用
    console.error('Init default data error:', error);
  }
};

// ============ 认证相关 ============
export const signUp = async (email: string, password: string, username: string) => {
  const { data, error } = await withTimeout(
    supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    }),
    3000
  );

  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email, password }),
    3000
  );

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  try {
    // 登出操作给较短超时，避免阻塞用户体验
    const { error } = await withTimeout(supabase.auth.signOut(), 1500);
    if (error) throw error;
  } catch (error: any) {
    // 即使超时也静默处理，session 清除由客户端状态管理
    console.error('Sign out error:', error);
  }
};

export const resetPassword = async (email: string) => {
  const { error } = await withTimeout(
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
    3000
  );

  if (error) throw error;
};

export const updateUserPassword = async (newPassword: string) => {
  const { error } = await withTimeout(
    supabase.auth.updateUser({ password: newPassword }),
    3000
  );

  if (error) throw error;
};

// ============ 监听认证状态 ============
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
