# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在本项目中工作时提供指导。

## 项目简介

LiteLedger（轻账）是一个个人记账移动优先的 Web 应用，基于 React + Vite + TypeScript 构建。用户可以记录支出和收入、查看交易历史、分析消费统计、追踪储蓄目标，以及在日历视图中查看交易记录。

## 命令

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器（端口 3000）
npm run build     # 生产环境构建
npm run preview   # 预览生产构建
npm run lint      # TypeScript 类型检查
```

## 设计特点

- **移动优先**: 桌面端使用侧边栏导航，移动端使用底部导航栏
- **数据持久化**: 所有数据存储在浏览器 localStorage 中，键名为 `lite-ledger-storage`

## 架构

### 技术栈
- **框架**: React 19 + Vite 6
- **语言**: TypeScript
- **路由**: react-router-dom（HashRouter - 使用 `#/path` 格式 URL）
- **状态管理**: Zustand + localStorage 持久化（键名: `lite-ledger-storage`）
- **样式**: Tailwind CSS v4（使用 `@tailwindcss/vite` 插件）
- **图标**: lucide-react
- **图表**: recharts
- **日期处理**: date-fns（用于日期格式化和日历功能）
- **拖拽排序**: @dnd-kit/core + @dnd-kit/sortable（用于 EntryPage 分类拖拽排序）

### 状态管理
应用使用 [store.ts](store.ts) 中的 Zustand store，配合 `persist` 中间件。数据存储在 localStorage 中，键名为 `lite-ledger-storage`。

核心状态：
- `records`: TransactionRecord[] - 所有交易记录
- `categories`: Category[] - 支出/收入分类及子分类
- `channels`: Channel[] - 支付渠道（微信、支付宝、银行、现金等）
- `hasInitializedSavings`: boolean - 追踪储蓄目标初始化状态

核心方法：
- `addRecord()` - 添加交易记录
- `deleteRecord()` - 删除交易记录
- `updateRecord()` - 更新交易记录
- `getCategory()` - 获取分类详情
- `getChannel()` - 获取渠道详情
- `getChannelBalance()` - 计算渠道余额
- `clearAllData()` - 清除所有数据
- `addCategory()` - 添加自定义分类
- `deleteCategory()` - 删除分类
- `deleteSubCategory()` - 删除子分类
- `reorderCategories()` - 分类排序（按支出/收入类型）
- `reorderChannels()` - 支付渠道排序

### 认证存储
应用使用独立的 [store/authStore.ts](store/authStore.ts)，数据存储在 localStorage 中，键名为 `lite-ledger-auth`。

核心状态：
- `currentUser`: User | null - 当前登录用户
- `isAuthenticated`: boolean - 是否已登录

核心方法：
- `login()` - 登录验证
- `register()` - 注册新用户
- `logout()` - 退出登录
- `sendVerificationCode()` - 发送验证码（本地生成 6 位数字）
- `resetPassword()` - 重置密码

验证码存储在 localStorage 中（键名: `lite-ledger-verification-code`），有效期 5 分钟，开发环境会打印到控制台。

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
- [store.ts](store.ts) - 数据 Zustand store（交易记录、分类、渠道）
- [store/authStore.ts](store/authStore.ts) - 认证 Zustand store（登录、注册、登出）
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
- `pages/EntryPage.tsx` - 快速记账首页，支持支出/收入类型切换、分类选择、金额输入、日期选择、支付渠道选择、备注添加；支持分类拖拽排序
- `pages/TransactionsPage.tsx` - 交易明细列表（按日分组显示）
- `pages/StatsPage.tsx` - 收支统计图表（饼图、折线图）
- `pages/SavingsPage.tsx` - 储蓄目标追踪
- `pages/CalendarPage.tsx` - 日历视图（按月查看每日收支）
- `pages/SettingsPage.tsx` - 应用设置（含退出登录、清空数据、主题切换）
- `pages/LoginPage.tsx` - 登录页面
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
  password: string;
  createdAt: number;
}

// 验证码
interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number;
}
```

