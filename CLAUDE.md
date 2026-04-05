# CLAUDE.md

LiteLedger（轻账）- 个人记账移动优先 Web 应用，基于 React + Vite + TypeScript + Supabase。

## 命令

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器（端口 3000）
npm run build     # 生产环境构建
npm run preview   # 预览生产构建
npm run lint      # TypeScript 类型检查
```

## 技术栈

React 19 + Vite 6 + TypeScript + Supabase (PostgreSQL + Auth + Realtime) + Zustand + Tailwind CSS v4 + lucide-react + recharts + date-fns + @dnd-kit

## 模块 CLAUDE.md

项目包含 5 个模块文档，涉及功能修改时优先浏览对应文件：

| 模块 | 路径 | 说明 |
|------|------|------|
| 数据层 | [modules/data-layer/CLAUDE.md](modules/data-layer/CLAUDE.md) | Supabase 客户端、API、实时订阅 |
| 状态管理 | [modules/state-management/CLAUDE.md](modules/state-management/CLAUDE.md) | Zustand stores |
| 页面 | [modules/pages/CLAUDE.md](modules/pages/CLAUDE.md) | 11 个页面组件 |
| 组件 | [modules/components/CLAUDE.md](modules/components/CLAUDE.md) | 可复用 UI 组件 |
| 类型与常量 | [modules/types-and-constants/CLAUDE.md](modules/types-and-constants/CLAUDE.md) | 类型定义、默认分类/渠道常量 |

## 路由

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

## 数据模型

```typescript
type TransactionType = 'expense' | 'income' | 'transfer';

interface TransactionRecord {
  id: string; amount: number; categoryId: string;
  subCategoryId?: string; channelId?: string; toChannelId?: string;
  type: TransactionType; date: string; note?: string;
  createdAt: number; isInitialBalance?: boolean;
}

interface Category {
  id: string; name: string; iconName: string;
  type: TransactionType; color?: string; subCategories?: SubCategory[];
}

interface Channel {
  id: string; name: string; iconName: string; color?: string; balance: number;
}
```

## 核心文件

- `lib/api.ts` - 所有数据库 CRUD 操作
- `lib/supabase.ts` - Supabase 客户端和数据转换
- `lib/realtime.ts` - 实时订阅
- `store.ts` - 主数据 Store
- `store/authStore.ts` - 认证 Store
- `components/SettingsOverlay.tsx` - 存款页账户设置
- `components/EditTransactionModal.tsx` - 编辑交易弹窗
- `components/PageTransition.tsx` - 页面过渡动画

## AI 语音记账功能

### 核心文件

| 文件 | 说明 |
|------|------|
| `pages/AIPage.tsx` | AI 助手页面，语音/文字记账入口 |
| `lib/minimax.ts` | MiniMax API 调用，解析语音为结构化交易 |
| `lib/iflytek.ts` | 科大讯飞实时语音转写（WebSocket） |
| `components/AIChatArea.tsx` | 对话区域，显示消息和记账卡片 |
| `components/AITransactionCard.tsx` | 记账卡片，显示 AI 解析结果 |
| `components/AIEditModal.tsx` | 编辑弹窗，确认/修改 AI 解析结果 |
| `components/AIVoiceRecorder.tsx` | 录音组件 |
| `components/AIVoiceRecordingModal.tsx` | 录音确认弹窗 |

### 数据流

1. 用户语音 → iFlytek 实时转写 → AIVoiceRecordingModal
2. 转写文本 → MiniMax API `analyzeTransaction()` → `ParsedTransaction`
3. `ParsedTransaction` → `AITransactionCard` 显示 → 用户确认
4. 确认后 → `handleTransactionConfirm()` → `addRecord()` → 数据库

### 转账记录特殊处理

**转账创建（AIPage.tsx）**：创建两条记录
- 转出：amount 负数，note 格式 `转出至${账户名}`
- 转入：amount 正数，note 格式 `从${账户名}转入`

**转账显示（EditTransactionModal.tsx）**：通过解析 note 获取对手方账户
- 转入记录：匹配 `^从(.+?)转入`
- 转出记录：匹配 `^转出至(.+?)(?:-|：|$)`

修改转账相关代码时需注意两侧一致性。

## 开发注意事项

1. **用户隔离**: 所有 API 调用必须传入 `userId`
2. **先更新远程**: 所有数据操作先更新 Supabase，成功后更新本地状态
3. **实时订阅**: 在 `initData()` 设置，`cleanup()` 清理
4. **AI 解析字段兼容**: AI 可能返回中文 type、subcategory（而非 subCategory）、payment_method（而非 channel）、to_channel（而非 toChannel）

## PWA 支持

项目已配置 PWA，可添加到主屏幕获得 App 体验：
- `vite.config.ts` - PWA 插件配置
- `public/icon-192.png` / `icon-512.png` - App 图标
- iOS: Safari → 分享 → 添加到主屏幕
- Android: Chrome → 菜单 → 安装应用

## 部署

```bash
npm run build    # 构建到 dist 目录
# 部署 dist 目录到 Vercel 或其他静态托管
