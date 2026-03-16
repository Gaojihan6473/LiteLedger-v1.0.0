# 数据层模块 (Data Layer)

Supabase 数据库交互操作，数据持久化层。

## 核心文件

- [lib/supabase.ts](lib/supabase.ts) - 客户端配置、数据库类型、数据转换
- [lib/api.ts](lib/api.ts) - 所有 CRUD 操作
- [lib/realtime.ts](lib/realtime.ts) - Realtime 实时订阅

## 数据库表

| 表名 | 说明 |
|------|------|
| `profiles` | 用户资料 |
| `categories` | 支出/收入分类（含 user_id 隔离） |
| `sub_categories` | 二级分类 |
| `channels` | 支付渠道（含余额） |
| `transactions` | 交易记录 |

## supabase.ts 类型

```typescript
interface DbCategory {
  id: string; user_id: string; name: string; icon_name: string;
  type: 'expense' | 'income' | 'transfer'; color?: string;
  sort_order: number; is_default: boolean;
}

interface DbChannel {
  id: string; user_id: string; name: string; icon_name: string;
  color?: string; sort_order: number; balance: number;
}

interface DbTransaction {
  id: string; user_id: string; amount: number; category_id?: string;
  sub_category_id?: string; channel_id?: string; to_channel_id?: string;
  type: 'expense' | 'income' | 'transfer'; date: string;
  note?: string; is_initial_balance: boolean;
}
```

## 数据转换

数据库 snake_case ↔ 前端 camelCase：

| 转换函数 | 说明 |
|---------|------|
| `convertDbCategoryToCategory()` | DbCategory → Category |
| `convertDbChannelToChannel()` | DbChannel → Channel |
| `convertDbTransactionToRecord()` | DbTransaction → TransactionRecord |

## api.ts 函数

| 分类 | 函数 |
|------|------|
| 分类 | `fetchCategories()`, `addCategory()`, `deleteCategory()` |
| 子分类 | `addSubCategory()`, `deleteSubCategory()` |
| 渠道 | `fetchChannels()`, `addChannel()`, `batchUpdateChannelBalances()` |
| 交易 | `fetchTransactions()`, `addTransaction()`, `updateTransaction()`, `deleteTransaction()` |
| 认证 | `signUp()`, `signIn()`, `signOut()`, `resetPassword()` |
| 初始化 | `initDefaultData()`, `clearAllUserData()` |

## realtime.ts 订阅

| 函数 | 说明 |
|------|------|
| `subscribeToTransactions(userId, callbacks)` | 监听交易变化 |
| `subscribeToCategories(userId, callbacks)` | 监听分类变化 |
| `subscribeToChannels(userId, callbacks)` | 监听渠道变化 |

所有订阅通过 `user_id=eq.{userId}` 过滤确保数据隔离。

## 开发注意

1. 所有操作必须传入 `userId` 确保隔离
2. 使用 `withTimeout` 包装请求，默认 3 秒超时
3. 订阅在 `store.initData()` 设置，`store.cleanup()` 清理
