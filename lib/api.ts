import { supabase, DbCategory, DbSubCategory, DbChannel, DbTransaction, convertDbCategoryToCategory, convertDbChannelToChannel, convertDbTransactionToRecord, convertCategoryToDb, convertChannelToDb, convertRecordToDb } from './supabase';
import { Category, Channel, TransactionRecord } from '../types';
import type { User } from '../types/auth';
import { useAuthStore } from '../store/authStore';

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

// initDefaultData 互斥锁，防止并发调用导致重复插入
let initDefaultDataPromise: Promise<void> | null = null;

// 获取当前用户
export const getCurrentUser = async (): Promise<User | null> => {
  let user = null;
  try {
    const result = await withTimeout(() => supabase.auth.getUser(), 3000);
    user = result?.data?.user;
  } catch (error) {
    console.warn('getUser error:', error);
    return null;
  }
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
    // 按 id 去重
    const seen = new Set<string>();
    const uniqueCategories = (categories || []).filter(cat => {
      if (seen.has(cat.id)) return false;
      seen.add(cat.id);
      return true;
    });
    return uniqueCategories.map(convertDbCategoryToCategory);
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

  // 如果有二级分类，保存到 sub_categories 表
  if (category.subCategories && category.subCategories.length > 0) {
    for (const subCategory of category.subCategories) {
      await addSubCategory(data.id, userId, subCategory.name);
    }
    // 重新查询以获取最新的二级分类数据
    const { data: updatedData } = await supabase
      .from('categories')
      .select('*, sub_categories(*)')
      .eq('id', data.id)
      .single();
    return convertDbCategoryToCategory(updatedData);
  }

  return convertDbCategoryToCategory(data);
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

  // 使用 update 而不是 upsert，因为用户只更新现有记录的 sort_order
  // RLS 策略不允许 upsert 插入新行
  for (const update of updates) {
    const { error } = await supabase
      .from('categories')
      .update({ sort_order: update.sort_order, updated_at: update.updated_at })
      .eq('id', update.id)
      .eq('user_id', userId);

    if (error) throw error;
  }
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
    // 按 id 去重
    const seen = new Set<string>();
    const uniqueChannels = (data || []).filter(ch => {
      if (seen.has(ch.id)) return false;
      seen.add(ch.id);
      return true;
    });
    return uniqueChannels.map(convertDbChannelToChannel);
  } catch (error) {
    console.warn('Fetch channels failed:', error);
    return [];
  }
};

export const addChannel = async (userId: string, channel: Omit<Channel, 'id'>, initialBalance?: number) => {
  const dbData = convertChannelToDb(channel, userId);
  if (initialBalance !== undefined) {
    dbData.balance = initialBalance;
  }
  const { data, error } = await supabase
    .from('channels')
    .insert(dbData)
    .select()
    .single();

  if (error) throw error;
  return convertDbChannelToChannel(data);
};

export const updateChannelBalance = async (channelId: string, newBalance: number) => {
  const { error } = await supabase
    .from('channels')
    .update({
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq('id', channelId);

  if (error) throw error;
};

export const batchUpdateChannelBalances = async (
  updates: Array<{ id: string; balance: number }>
) => {
  const authState = useAuthStore.getState();
  const userId = authState.currentUser?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // 先尝试更新属于当前用户的渠道
  for (const update of updates) {
    const { error } = await supabase
      .from('channels')
      .update({
        balance: update.balance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', update.id)
      .eq('user_id', userId);

    if (error) {
      // 如果更新失败（可能记录不存在），尝试插入
      const { error: insertError } = await supabase.from('channels').upsert({
        id: update.id,
        user_id: userId,
        balance: update.balance,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

      if (insertError) throw insertError;
    }
  }
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

  // 使用 update 而不是 upsert，因为用户只更新现有记录的 sort_order
  // RLS 策略不允许 upsert 插入新行
  for (const update of updates) {
    const { error } = await supabase
      .from('channels')
      .update({ sort_order: update.sort_order, updated_at: update.updated_at })
      .eq('id', update.id)
      .eq('user_id', userId);

    if (error) throw error;
  }
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

  // 先插入数据
  const { error: insertError } = await supabase.from('transactions').insert(dbData);

  if (insertError) {
    console.error('Insert transaction error:', insertError);
    throw insertError;
  }

  // 插入成功后，查询刚插入的记录
  // 使用 date 和 amount 作为辅助查询条件（同一用户同时间同金额几乎唯一）
  const { data, error: queryError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('amount', dbData.amount)
    .eq('date', dbData.date)
    .eq('type', dbData.type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (queryError) {
    console.error('Query transaction error:', queryError);
    throw queryError;
  }

  if (!data) throw new Error('Failed to create transaction: no data returned');
  return convertDbTransactionToRecord(data);
};

export const updateTransaction = async (id: string, updates: Partial<TransactionRecord>) => {
  const dbUpdates: any = {};
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.categoryId !== undefined) {
    dbUpdates.category_id = updates.categoryId;
  }
  if (updates.subCategoryId !== undefined) {
    dbUpdates.sub_category_id = updates.subCategoryId;
  }
  if (updates.channelId !== undefined) {
    dbUpdates.channel_id = updates.channelId;
  }
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

// ============ 清除用户所有数据 ============
export const clearAllUserData = async (userId: string) => {
  try {
    // 1. 清除交易记录
    await supabase.from('transactions').delete().eq('user_id', userId);

    // 2. 获取自定义分类的 ID（用于删除关联的子分类）
    const { data: customCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('is_default', false);

    // 3. 删除自定义分类的子分类
    if (customCategories && customCategories.length > 0) {
      const customCategoryIds = customCategories.map(c => c.id);
      await supabase
        .from('sub_categories')
        .delete()
        .in('category_id', customCategoryIds);
    }

    // 4. 删除自定义分类
    await supabase
      .from('categories')
      .delete()
      .eq('user_id', userId)
      .eq('is_default', false);

    // 5. 渠道保留，不做操作
  } catch (error) {
    console.error('Clear all data error:', error);
    throw error;
  }
};

// ============ 默认数据初始化 ============
export const initDefaultData = async (userId: string) => {
  // 如果已有进行中的初始化，等待完成
  if (initDefaultDataPromise) {
    await initDefaultDataPromise;
    // 等待完成后再次检查是否有数据
    const { data: existingCategories } = await withTimeout(
      supabase.from('categories').select('id').eq('user_id', userId).limit(1),
      3000
    );
    if (existingCategories && existingCategories.length > 0) {
      return;
    }
  }

  // 创建新的初始化 promise
  initDefaultDataPromise = (async () => {
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
      if (cat.subCategories && insertedCategories?.[catIndex]) {
        const dbCategory = insertedCategories[catIndex];
        cat.subCategories.forEach((sub: any) => {
          subCategoriesToInsert.push({
            category_id: dbCategory.id,
            user_id: userId,
            name: sub.name,
          });
        });
      }
    });

    if (subCategoriesToInsert.length > 0) {
      const { error: subCatError } = await withTimeout(
        supabase.from('sub_categories').insert(subCategoriesToInsert),
        3000
      );
      if (subCatError) {
        console.error('Insert sub categories error:', subCatError);
      }
    }

    // 插入默认渠道
    const channelsToInsert = DEFAULT_CHANNELS.map((ch: any, index: number) => ({
      user_id: userId,
      name: ch.name,
      icon_name: ch.iconName,
      color: ch.color,
      sort_order: index,
      balance: 0,
    }));

    const { error: chanError } = await withTimeout(
      supabase.from('channels').insert(channelsToInsert),
      3000
    );

    if (chanError) throw chanError;
    } catch (error) {
      // 静默失败，不阻塞应用
      console.error('Init default data error:', error);
    } finally {
      initDefaultDataPromise = null;
    }
  })();

  await initDefaultDataPromise;
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
