# 核心组件模块 (Core Components)

可复用 UI 组件，位于 [components/](components/) 目录。

## 组件列表

| 组件 | 说明 |
|------|------|
| Layout.tsx | 主布局（桌面侧边栏/移动端底部导航） |
| BottomNav.tsx | 移动端底部导航 |
| Button.tsx | 按钮（variant: primary/secondary/danger/ghost, size: sm/md/lg） |
| Icon.tsx | lucide-react 图标封装 |
| Input.tsx | 输入框（支持 prefix、密码切换、error 状态） |
| AddCategoryModal.tsx | 新增/编辑分类弹窗 |
| ConfirmDialog.tsx | 确认对话框 |
| DatePicker.tsx | 日期选择器（date-fns） |
| SelectPicker.tsx | 下拉选择器（支持搜索、多选） |
| AuthLayout.tsx | 认证页面通用布局 |
| SettingsOverlay.tsx | 存款页设置覆盖层（账户管理） |
| EditTransactionModal.tsx | 编辑交易弹窗 |
| PageTransition.tsx | 页面过渡动画组件 |

## 核心组件 Props

### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}
```

### Input
```typescript
interface InputProps {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
}
```

### AddCategoryModal
```typescript
interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: Category) => void;
  editCategory?: Category;
}
```

### SettingsOverlay
```typescript
interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}
```
用于 SavingsPage 的账户设置，支持添加/删除/编辑账户。

### EditTransactionModal
```typescript
interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: TransactionRecord | null;
}
```
用于 EntryPage/TransactionsPage 编辑已有交易。

### PageTransition
```typescript
interface PageTransitionProps {
  children: React.ReactNode;
}
```
路由切换时的淡入淡出动画。

## useConfirmDialog Hook

Promise 风格确认对话框：

```typescript
const { confirm, ConfrimDialogComponent } = useConfirmDialog();
const confirmed = await confirm({
  title: '确认删除',
  message: '确定要删除吗？',
  confirmText: '删除'
});
```

## 开发注意

1. 复用现有组件，避免重复
2. Props 使用 TypeScript 定义
3. 使用 Tailwind CSS
4. 弹窗使用 Portal 确保 z-index
5. 移动端交互：避免 touch 事件与页面滚动冲突
