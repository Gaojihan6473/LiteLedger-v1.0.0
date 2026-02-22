
export type TransactionType = 'expense' | 'income' | 'transfer';

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  type: TransactionType;
  color?: string;
  sortOrder?: number;
  isDefault?: boolean;
  subCategories?: SubCategory[];
}

export interface Channel {
  id: string;
  name: string;
  iconName: string;
  color?: string;
  sortOrder?: number;
  balance?: number;
}

export interface TransactionRecord {
  id: string;
  amount: number;
  categoryId: string;
  subCategoryId?: string;
  channelId?: string;
  toChannelId?: string; // 转账目标渠道
  type: TransactionType;
  date: string;
  note?: string;
  createdAt: number;
  isInitialBalance?: boolean; // 初始余额标记，不计入统计
}

export interface DayGroup {
  date: string; // ISO Date string (YYYY-MM-DD)
  records: TransactionRecord[];
  totalExpense: number;
  totalIncome: number;
}

// Stats types
export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  percentage: number;
}
