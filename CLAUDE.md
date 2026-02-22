# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在本项目中工作时提供指导。

## 项目简介

LiteLedger（轻账）是一个个人记账移动优先的 Web 应用，基于 React + Vite + TypeScript + Supabase 构建。用户可以记录支出和收入、查看交易历史、分析消费统计、追踪储蓄目标，以及在日历视图中查看交易记录。支持多设备实时同步。

## 命令

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器（端口 3000）
npm run build     # 生产环境构建
npm run preview   # 预览生产构建
npm run lint      # TypeScript 类型检查
```

## 环境变量

项目需要以下 Supabase 环境变量（配置在 `.env` 文件中）：
- `VITE_SUPABASE_URL` - Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

## 设计特点

- **移动优先**: 桌面端使用侧边栏导航，移动端使用底部导航栏
- **云端数据持久化**: 所有数据存储在 Supabase PostgreSQL 数据库中
- **实时同步**: 使用 Supabase Realtime 实现多设备数据同步

## 架构

### 技术栈
- **框架**: React 19 + Vite 6
- **语言**: TypeScript
- **后端**: Supabase (PostgreSQL + Auth + Realtime)
- **路由**: react-router-dom（HashRouter - 使用 `#/path` 格式 URL）
- **状态管理**: Zustand（数据存储在内存，通过 Supabase 持久化）
- **样式**: Tailwind CSS v4（使用 `@tailwindcss/vite` 插件）
- **图标**: lucide-react
- **图表**: recharts
- **日期处理**: date-fns（用于日期格式化和日历功能）
- **拖拽排序**: @dnd-kit/core + @dnd-kit/sortable（用于 EntryPage 分类拖拽排序）

### 数据层

#### 数据库表（lib/supabase.ts）
- `profiles` - 用户资料
- `categories` - 支出/收入分类（包含 `user_id` 隔离）
- `sub_categories` - 二级分类（通过 `category_id` 外键关联）
- `channels` - 支付渠道（含余额）
- `transactions` - 交易记录

#### API 层（lib/api.ts）
所有数据库操作通过 API 层：
- `fetchCategories()`, `addCategory()`, `deleteCategory()`, `reorderCategoriesDb()`
- `addSubCategory()`, `deleteSubCategory()`
- `fetchChannels()`, `addChannel()`, `updateChannelBalance()`, `batchUpdateChannelBalances()`
- `fetchTransactions()`, `addTransaction()`, `updateTransaction()`, `deleteTransaction()`
- `initDefaultData()` - 首次登录时初始化默认分类和渠道
- 认证相关: `signUp()`, `signIn()`, `signOut()`, `resetPassword()`, `updateUserPassword()`

#### 实时订阅（lib/realtime.ts）
- `subscribeToTransactions()` - 监听交易 INSERT/UPDATE/DELETE
- `subscribeToCategories()` - 监听分类变化
- `subscribeToChannels()` - 监听渠道变化
- 所有订阅按 `user_id` 过滤，确保数据隔离

### 状态管理

#### 主数据 Store（store.ts）
使用 Zustand，通过 `lib/api.ts` 与 Supabase 通信。

核心状态：
- `categories`: Category[] - 支出/收入分类及子分类
- `channels`: Channel[] - 支付渠道
- `records`: TransactionRecord[] - 交易记录
- `hasInitializedSavings`: boolean - 追踪储蓄目标初始化状态
- `isLoading`, `isSyncing`, `error` - 加载状态

核心方法（所有方法先更新 Supabase，成功后更新本地状态）：
- `initData()` - 从 Supabase 加载数据并设置实时订阅
- `addRecord()`, `deleteRecord()`, `updateRecord()` - 交易记录操作
- `addCategory()`, `deleteCategory()`, `deleteSubCategory()` - 分类操作
- `addChannel()`, `deleteChannel()`, `reorderChannels()` - 渠道操作
- `getChannelBalance()` - 计算渠道余额
- `cleanup()` - 清理实时订阅

#### 认证 Store（store/authStore.ts）
使用 Supabase Auth，auth 状态持久化到 localStorage（键名: `lite-ledger-auth`）。

核心状态：
- `currentUser`: User | null - 当前登录用户
- `isAuthenticated`: boolean - 是否已登录

核心方法：
- `login()` - 邮箱或用户名登录
- `register()` - 注册新用户（自动初始化默认数据）
- `logout()` - 退出登录
- `resetPassword()` - 邮箱重置密码
- `checkAuth()` - 应用加载时同步认证状态

### 路由
| 路径 | 页面 | 描述 |
|------|------|-------------|
| `/` | EntryPage | 快速记账入口（支持分类拖拽排序） |
| `/transactions` | TransactionsPage | 交易列表 |
| `/stats` | StatsPage | 消费统计与图表 |
| `/savings` | SavingsPage | 储蓄目标 |
| `/calendar` | CalendarPage | 日历视图 |
| `/settings` | SettingsPage | 应用设置 |
| `/login` | LoginPage | 登录页面 |
| `/register` | RegisterPage | 注册页面 |
| `/forgot-password` | ForgotPasswordPage | 忘记密码页面 |
| `/user-agreement` | UserAgreementPage | 用户协议页面 |
| `/privacy-policy` | PrivacyPolicyPage | 隐私政策页面 |

项目使用路由守卫：
- `ProtectedRoute`: 未登录用户跳转登录页
- `PublicRoute`: 已登录用户访问公开页自动跳转首页

### 核心文件
- [types.ts](types.ts) - TransactionRecord、Category、Channel 等 TypeScript 接口定义
- [types/auth.ts](types/auth.ts) - 认证相关类型（User、VerificationCode、VALIDATION_RULES）
- [constants.ts](constants.ts) - 默认分类（16 个支出 + 7 个收入）、渠道及颜色常量
- [store.ts](store.ts) - 数据 Zustand store（调用 Supabase API）
- [store/authStore.ts](store/authStore.ts) - 认证 Zustand store（Supabase Auth）
- [lib/supabase.ts](lib/supabase.ts) - Supabase 客户端、数据库类型定义、数据转换函数
- [lib/api.ts](lib/api.ts) - 所有数据库 CRUD 操作
- [lib/realtime.ts](lib/realtime.ts) - Supabase Realtime 订阅
- [index.tsx](index.tsx) - 应用入口点
- [index.css](index.css) - 全局样式（Tailwind CSS v4 入口）
- [App.tsx](App.tsx) - 应用根组件，包含路由配置和路由守卫
- [vite.config.ts](vite.config.ts) - Vite 配置，包含 Tailwind CSS v4 插件

### 组件
- `components/Layout.tsx` - 主布局，包含桌面端侧边栏和移动端底部导航
- `components/BottomNav.tsx` - 导航组件
- `components/Button.tsx` - 自定义按钮组件（支持 primary/secondary/danger/ghost 变体）
- `components/Icon.tsx` - lucide-react 图标封装
- `components/AddCategoryModal.tsx` - 新增分类弹窗（支持图标选择、颜色选择、二级分类）
- `components/ConfirmDialog.tsx` - 确认对话框组件
- `components/Input.tsx` - 输入框组件（支持图标 prefix、密码明文/密文切换）
- `components/AuthLayout.tsx` - 认证页面通用布局（渐变背景 + 卡片）
- `components/DatePicker.tsx` - 日期选择器（基于 date-fns）
- `components/SelectPicker.tsx` - 下拉选择器

### 页面
- `pages/EntryPage.tsx` - 快速记账首页，支持支出/收入/转账类型切换、分类选择、金额输入、日期选择、支付渠道选择、备注添加；支持分类拖拽排序
- `pages/TransactionsPage.tsx` - 交易明细列表（按日分组显示）
- `pages/StatsPage.tsx` - 收支统计图表（饼图、折线图）
- `pages/SavingsPage.tsx` - 储蓄目标追踪
- `pages/CalendarPage.tsx` - 日历视图（按月查看每日收支）
- `pages/SettingsPage.tsx` - 应用设置（含退出登录、清空数据、主题切换）
- `pages/LoginPage.tsx` - 登录页面（支持邮箱/用户名登录）
- `pages/RegisterPage.tsx` - 注册页面
- `pages/ForgotPasswordPage.tsx` - 忘记密码页面（两步流程：邮箱验证→重置密码）
- `pages/UserAgreementPage.tsx` - 用户协议页面
- `pages/PrivacyPolicyPage.tsx` - 隐私政策页面

### Hooks
- `hooks/useConfirmDialog.ts` - 确认对话框 hook（Promise 风格的确认/取消）

## 数据模型

```typescript
// 交易类型
export type TransactionType = 'expense' | 'income' | 'transfer';

// 交易记录
interface TransactionRecord {
  id: string;
  amount: number;
  categoryId: string;
  subCategoryId?: string;
  channelId?: string;
  type: 'expense' | 'income' | 'transfer';
  date: string; // ISO 字符串
  note?: string;
  createdAt: number;
}

// 二级分类
interface SubCategory {
  id: string;
  name: string;
}

// 分类（含子分类）
interface Category {
  id: string;
  name: string;
  iconName: string; // lucide-react 图标名称
  type: 'expense' | 'income' | 'transfer';
  color?: string;
  subCategories?: SubCategory[];
}

// 支付渠道
interface Channel {
  id: string;
  name: string;
  iconName: string;
  color?: string;
  balance: number;
}

// 日分组（用于交易列表）
interface DayGroup {
  date: string; // ISO Date string (YYYY-MM-DD)
  records: TransactionRecord[];
  totalExpense: number;
  totalIncome: number;
}

// 分类统计
interface CategoryStat {
  categoryId: string;
  categoryName: string;
  color: string;
  total: number;
  percentage: number;
}

// 用户（认证）
interface User {
  id: string;
  username: string;
  email: string;
  createdAt: number;
}
```
