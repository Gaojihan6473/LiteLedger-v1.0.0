# 状态管理模块 (State Management)

Zustand 状态管理，与 Supabase 通信。

## 核心文件

- [store.ts](store.ts) - 主数据 Store
- [store/authStore.ts](store/authStore.ts) - 认证 Store

## 主数据 Store (store.ts)

### 状态

```typescript
interface AppState {
  categories: Category[];
  channels: Channel[];
  records: TransactionRecord[];
  hasInitializedSavings: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
}
```

### 核心方法

| 分类 | 方法 |
|------|------|
| 初始化 | `initData()` - 加载数据并设置订阅 |
| 交易 | `addRecord()`, `deleteRecord()`, `updateRecord()` |
| 分类 | `addCategory()`, `deleteCategory()`, `deleteSubCategory()` |
| 渠道 | `addChannel()`, `deleteChannel()`, `reorderChannels()` |
| 清理 | `cleanup()` - 取消订阅 |

### 数据更新策略

所有操作遵循：**先更新 Supabase → 成功后再更新本地状态**

## 认证 Store (authStore.ts)

### 状态

```typescript
interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
}
```

### 方法

| 方法 | 说明 |
|------|------|
| `login(emailOrUsername, password)` | 邮箱或用户名登录 |
| `register(username, email, password)` | 注册（自动初始化数据） |
| `logout()` | 退出登录 |
| `resetPassword(email)` | 邮箱重置密码 |
| `checkAuth()` | 同步认证状态 |

### 持久化

- 键名: `lite-ledger-auth`
- 字段: `isAuthenticated`, `currentUser`

## 开发注意

1. 用户隔离：API 调用必须传入当前用户 ID
2. 登出清理：必须调用 `useStore.getState().cleanup()` 取消订阅
3. 状态不一致处理参考 authStore.ts 注释
