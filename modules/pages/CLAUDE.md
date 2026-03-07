# 页面模块 (Page Modules)

11 个页面组件，每个对应对应一个路由。

## 页面

| 文件 | 路由 | 说明 |
|------|------|------|
| EntryPage.tsx | `/` | 快速记账入口（分类拖拽排序） |
| TransactionsPage.tsx | `/transactions` | 交易明细列表（按日分组） |
| StatsPage.tsx | `/stats` | 收支统计（饼图+折线图） |
| SavingsPage.tsx | `/savings` | 储蓄目标/账户管理 |
| CalendarPage.tsx | `/calendar` | 日历视图 |
| SettingsPage.tsx | `/settings` | 应用设置 |
| LoginPage.tsx | `/login` | 登录（邮箱/用户名） |
| RegisterPage.tsx | `/register` | 注册 |
| ForgotPasswordPage.tsx | `/forgot-password` | 忘记密码 |
| UserAgreementPage.tsx | `/user-agreement` | 用户协议 |
| PrivacyPolicyPage.tsx | `/privacy-policy` | 隐私政策 |

## 主要页面特性

### EntryPage
- 支出/收入/转账类型切换
- 分类选择 + 拖拽排序（@dnd-kit）
- 金额、日期、渠道、备注输入
- 支持编辑交易（EditTransactionModal）

### TransactionsPage
- 按日分组显示
- 每日收支汇总
- 删除交易

### StatsPage
- 饼图：分类占比
- 折线图：月度趋势
- recharts 库
- 支持月/周/日视图切换

### SavingsPage
- 总资产展示
- 账户列表（网格布局，响应式）
- 账户拖拽排序（@dnd-kit，仅编辑模式启用）
- 移动端滚动优化：DndContext 仅在编辑模式渲染
- 初始化余额弹窗

### CalendarPage
- 按月查看
- 每日金额标注
- date-fns 库

### SettingsPage
- 账户信息展示
- 退出登录
- 清空数据
- 关于信息

## 路由配置 (App.tsx)

使用 HashRouter，路由守卫：
- `ProtectedRoute`: 未登录 → 登录页
- `PublicRoute`: 已登录访问公开页 → 首页
- 页面过渡动画（PageTransition 组件）

## 开发注意

1. 数据获取：通过 `useStore` 获取
2. 响应式：移动优先，Tailwind md: 前缀适配桌面
3. 加载状态：使用 Zustand `isLoading`
4. 移动端拖拽：使用 PointerSensor 的 delay 约束避免滚动冲突
