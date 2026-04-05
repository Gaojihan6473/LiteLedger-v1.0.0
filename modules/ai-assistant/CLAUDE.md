# AI 助手模块 (AI Assistant)

语音/文字记账，AI 智能解析交易信息。

## 核心文件

| 文件 | 说明 |
|------|------|
| [pages/AIPage.tsx](pages/AIPage.tsx) | AI 助手页面，语音/文字记账入口 |
| [lib/minimax.ts](lib/minimax.ts) | MiniMax API 调用，解析语音为结构化交易 |
| [lib/iflytek.ts](lib/iflytek.ts) | 科大讯飞实时语音转写（WebSocket） |
| [components/AIChatArea.tsx](components/AIChatArea.tsx) | 对话区域，显示消息和记账卡片 |
| [components/AITransactionCard.tsx](components/AITransactionCard.tsx) | 记账卡片，显示 AI 解析结果 |
| [components/AIEditModal.tsx](components/AIEditModal.tsx) | 编辑弹窗，确认/修改 AI 解析结果 |
| [components/AIVoiceRecorder.tsx](components/AIVoiceRecorder.tsx) | 录音组件（含声波可视化） |
| [components/AIVoiceRecordingModal.tsx](components/AIVoiceRecordingModal.tsx) | 录音确认弹窗 |

## 数据流

```
用户语音 → iFlytek 实时转写 → AIVoiceRecordingModal
    ↓
转写文本 → MiniMax API analyzeTransaction() → ParsedTransaction
    ↓
ParsedTransaction → AITransactionCard 显示 → 用户确认
    ↓
确认后 → handleTransactionConfirm() → addRecord() → 数据库
```

## ParsedTransaction 类型

```typescript
interface ParsedTransaction {
  type: 'expense' | 'income' | 'transfer';
  amount: string | number;  // 金额
  category: string;        // 分类
  subCategory?: string;    // 二级分类
  channel: string;         // 账户/渠道
  toChannel?: string;      // 转入账户（转账时）
  date: string;             // 日期 YYYY-MM-DD
  note: string;             // 备注
}
```

## 转账记录特殊处理

### 创建（AIPage.tsx）

创建**两条**记录：
- 转出：`amount` 负数，`note` 格式 `转出至${账户名}`
- 转入：`amount` 正数，`note` 格式 `从${账户名}转入`

### 显示（EditTransactionModal.tsx）

通过解析 `note` 获取对手方账户：
- 转入记录：匹配 `^从(.+?)转入`
- 转出记录：匹配 `^转出至(.+?)(?:-|：|$)`

**修改转账相关代码时需注意两侧一致性。**

## AI 字段兼容

MiniMax API 可能返回非标准字段名，需兼容处理：

| 标准字段 | 兼容字段 | 说明 |
|---------|---------|------|
| `type` | 中文 `支出/收入/转账` | 自动映射 |
| `subCategory` | `subcategory` | 驼峰/全小写 |
| `channel` | `payment_method` | 账户/支付方式 |
| `toChannel` | `to_channel` | 驼峰/蛇形 |
| `date` | `time` | 日期/时间 |

## iFlytek 实时语音

- **采样率**：16000 Hz
- **编码**：16 位 PCM，单声道
- **鉴权**：HMAC-SHA256 签名（Web Crypto API）
- **返回格式**：Base64 编码的 UTF-8 JSON

### IflytekRecorder 类

```typescript
class IflytekRecorder {
  start(callbacks: IflytekCallbacks): Promise<void>;
  stop(): void;
  getAnalyser(): AnalyserNode | null;  // 用于波形可视化
  isRecording(): boolean;
}

interface IflytekCallbacks {
  onResult?: (text: string, isFinal: boolean, segId?: number) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}
```

## MiniMax API 解析策略

### 二级分类识别

1. **信息简略**（<15字）：强制从分类的二级分类中选择最匹配的
2. **信息丰富**（≥15字）：可模糊匹配，具体描述放入 note

### 转账类型识别

关键词：`从A转到B`、`从A转账到B`、`转B 100块`、`给B转100`、等

### 口语化映射

| 输入 | 映射 |
|------|------|
| 早饭/午饭/晚饭 | 早餐/午餐/晚餐 |
| 打的 | 打车 |
| ... | ... |

## 开发注意

1. **转账两侧一致性**：创建和显示时的 note 格式必须匹配
2. **字段兼容**：AI 可能返回各种格式变体，必须兼容处理
3. **麦克风权限**：录音前需确保用户已授权
4. **自动停止**：iFlytek 的 `status=2` 表示最后一帧，自动结束会话
