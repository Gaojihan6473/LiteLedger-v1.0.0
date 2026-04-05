# AI 智能分析功能技术方案

## 1. 设计原则

- **时间预过滤**：只传相关时间范围内的记录，减少 token 用量
- **AI 语义匹配 + 代码确定性计算**：AI 负责语义理解（匹配分类），代码负责金额 sum，保证财务准确性
- **意图分类优先**：先判断是记账还是分析，再路由

## 2. 意图分类

### 2.1 MiniMax API 实现

在 `lib/minimax.ts` 新增 `classifyIntent(text)`，**调用 MiniMax API** 返回：

```typescript
type Intent = 'recording' | 'analysis';

export async function classifyIntent(text: string): Promise<Intent | null> {
  if (!text.trim()) {
    return null;
  }

  const prompt = `你是一个记账助手，需要判断用户的意图。

用户输入：${text}

请分析这个输入的意图：
1. recording（记账）：用户想要记录一笔交易
2. analysis（分析）：用户想要查询或分析已有数据

请直接输出一个词：recording 或 analysis`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {

    const response = await fetch(`${BASE_URL}/text/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: [
          { role: 'system', content: '你是一个记账助手，擅长判断用户意图。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 20,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('classifyIntent HTTP error:', response.status);
      return null;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    if (result === 'recording' || result === 'analysis') {
      return result;
    }

    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('classifyIntent timeout');
    } else {
      console.error('classifyIntent error:', error);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**返回值**：`Promise<Intent | null>` — `null` 表示 API 失败或无法解析。

**失败处理策略**：
- 返回 `null` 时，调用方累积失败计数
- 连续失败 2 次以上：提示用户"无法识别意图，请换个说法"
- 不默认走 recording，避免错误记账

### 2.2 时间预解析

在 `lib/date-parser.ts` 中新增 `parseTime(text)`，返回时间范围：

```typescript
interface TimeRange {
  start: string;  // 'YYYY-MM-DD'
  end: string;     // 'YYYY-MM-DD'
  label: string;   // 用于显示："2026年3月"
}

export function parseTime(text: string): TimeRange | null {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // 每个规则：[正则, 创建 TimeRange 的函数]
  // 注意：按优先级排序——更长/更具体的模式在前，本月优先于上月
  const rules: [RegExp, (match: RegExpMatchArray) => TimeRange | null][] = [
    // 上上月（最长，先匹配）
    [/上上月/, () => {
      const p = subMonths(today, 2);
      return {
        start: format(startOfMonth(p), 'yyyy-MM-dd'),
        end: format(endOfMonth(p), 'yyyy-MM-dd'),
        label: format(p, 'yyyy年M月')
      };
    }],

    // 本月（优先于上月，避免"本月比上个月"被误判为上月）
    [/本月/, () => ({
      start: format(startOfMonth(today), 'yyyy-MM-dd'),
      end: todayStr,
      label: '本月'
    })],

    // 上月
    [/上月/, () => {
      const p = subMonths(today, 1);
      return {
        start: format(startOfMonth(p), 'yyyy-MM-dd'),
        end: format(endOfMonth(p), 'yyyy-MM-dd'),
        label: format(p, 'yyyy年M月')
      };
    }],

    // 今天
    [/今天/, () => ({ start: todayStr, end: todayStr, label: '今天' })],

    // 昨天
    [/昨天/, () => {
      const y = subDays(today, 1);
      return { start: format(y, 'yyyy-MM-dd'), end: format(y, 'yyyy-MM-dd'), label: '昨天' };
    }],

    // 本周
    [/本周/, () => ({
      start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      end: todayStr,
      label: '本周'
    })],

    // 上周
    [/上周/, () => {
      const p = subDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
      return {
        start: format(p, 'yyyy-MM-dd'),
        end: format(endOfWeek(p, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        label: '上周'
      };
    }],

    // 最近 N 天：如"最近7天"（限制 1-365 天）
    [/最近(\d+)天/, (m) => {
      const n = parseInt(m[1]);
      if (n < 1 || n > 365) return null;
      const s = subDays(today, n - 1);
      return { start: format(s, 'yyyy-MM-dd'), end: todayStr, label: `最近${n}天` };
    }],

    // 指定月份：如"今年3月"、"3月"（需限制 1-12）
    [/(?:今年)?(\d+)月/, (m) => {
      const month = parseInt(m[1]);
      if (month < 1 || month > 12) return null;
      const d = new Date(today.getFullYear(), month - 1, 1);
      return {
        start: format(startOfMonth(d), 'yyyy-MM-dd'),
        end: format(endOfMonth(d), 'yyyy-MM-dd'),
        label: format(d, 'yyyy年M月')
      };
    }],
  ];

  for (const [pattern, createTimeRange] of rules) {
    const match = text.match(pattern);
    if (match) {
      const result = createTimeRange(match);
      if (result !== null) return result;
    }
  }

  return null;
}
```

**关键设计**：
- 规则数组按优先级排序：**更长/更具体的模式在前**（如"上上月"在"上月"前）
- 使用 `text.match(pattern)` 提取匹配部分，支持"这个月奶茶花了多少"
- 月份限制 1-12，无效返回 `null`

## 3. 数据传递

### 3.1 数据来源

从 Zustand store 的 `records` 数组获取，**不使用 SQL**。

### 3.2 预过滤逻辑

预过滤在 `analyzeQuery` 函数内实现（`lib/ai-analysis.ts`）：

```typescript
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import type { TransactionRecord } from '../types';
import type { TimeRange } from './date-parser';

function filterRecords(records: TransactionRecord[], timeRange: TimeRange): TransactionRecord[] {
  // 1. 时间过滤
  const filtered = records
    .filter(r => {
      const recordDate = parseISO(r.date);
      return isWithinInterval(recordDate, {
        start: startOfDay(parseISO(timeRange.start)),
        end: endOfDay(parseISO(timeRange.end))
      });
    })
    // 2. 排除转账记录（避免重复计算）
    .filter(r => r.type !== 'transfer')
    // 3. 按日期倒序排序
    .sort((a, b) => b.date.localeCompare(a.date));

  // 4. 数量上限（防止 token 超限）
  if (filtered.length > 500) {
    return filtered.slice(0, 500);
  }

  return filtered;
}

function buildTransactionList(records: TransactionRecord[]): string {
  if (records.length === 0) {
    return '（无交易记录）';
  }

  return records.map((r, i) =>
    `${i} | ${r.date} | ${r.type} | ${r.amount} | ${r.categoryName || ''} | ${r.subCategoryName || ''} | ${r.channelName || ''} | ${r.note || ''}`
  ).join('\n');
}
```

**关键设计**：
- 过滤后排序（按日期倒序），保证截断时保留最新记录
- 转账记录（`type=transfer`）已排除，避免金额重复计算

### 3.3 余额查询处理

"账户还有多少余额"等查询**不传交易记录**，从 `channels.balance` 读取：

```typescript
export async function queryBalance(
  question: string,
  channels: ChannelInfo[]
): Promise<string> {
  const channelList = channels.map(c => `${c.name}：${c.balance}元`).join('\n');

  const prompt = `用户问：${question}

账户余额信息：
${channelList}

请根据上述信息用自然语言回答用户的问题。`;

  // 调用 MiniMax API，返回自然语言回答
  // ...
}
```

### 3.4 数据格式

交易记录转为纯文本，每条带索引（用于 AI 返回匹配）：

```
0 | 2026-03-15 | expense | -30 | 餐饮 | 午餐 | 支付宝 | 外卖
1 | 2026-03-16 | income | 5000 | 工资 |  | 招商银行 |
```

## 4. 分析 Prompt 设计

### 4.1 Prompt 结构

```
用户问题：{question}

时间范围：{label}（{start} 至 {end}）

符合该时间范围的交易记录（共 {count} 条）：
{transactionList}

请分析上述记录，回答用户的问题。

重要规则：
1. 语义匹配：根据用户问题中的关键词，找出匹配的记录索引
2. 类型判断：根据问题判断应匹配什么类型的记录
   - 问"花了多少"、"支出"→ 只匹配 expense 记录
   - 问"收入多少"、"收到"→ 只匹配 income 记录
   - 问"花了多少"但记录中有 income → income 不应被匹配
3. 返回格式：必须返回 JSON 格式
4. 只做匹配：不要进行任何金额计算，只返回匹配的记录索引
5. answer 字段：只描述分析结论，不要包含具体金额数字

返回格式：
{
  "matchedIndexes": [0, 3, 7],  // 匹配的记录索引
  "answer": "找到 3 条奶茶相关消费"  // 自然语言回答（不含金额）
}
```

### 4.2 返回值结构

```typescript
interface AnalysisResult {
  matchedIndexes: number[];  // 匹配的记录索引
  answer: string;           // 自然语言回答（不含金额）
}
```

**关键设计**：
- AI **只做语义匹配**，返回匹配的记录索引
- AI 会根据问题类型筛选：问"花了多少"只匹配 expense，问"收入"只匹配 income
- **不返回金额**，避免 AI 计算错误
- `answer` 只描述分析结论，不含金额数字

### 4.3 代码计算示例

```typescript
async function analyzeQuery(
  text: string,
  records: TransactionRecord[],
  categories: CategoryInfo[],
  timeRange: TimeRange
): Promise<string> {
  const filtered = filterRecords(records, timeRange);
  const transactionList = buildTransactionList(filtered);

  // 调用 AI 获取匹配索引
  const result = await callMiniMaxAI(text, timeRange, transactionList);

  if (result.matchedIndexes.length === 0) {
    return result.answer || '没有找到符合条件的记录';
  }

  // 代码确定性计算金额
  // 注意：expense 的 amount 在数据库中存负数（如 -30），income 存正数（如 5000）
  // 按类型分开累计，保证展示语义正确
  let expenseTotal = 0;
  let incomeTotal = 0;
  for (const idx of result.matchedIndexes) {
    if (idx >= 0 && idx < filtered.length) {
      const record = filtered[idx];
      if (record.type === 'expense') {
        expenseTotal += Math.abs(record.amount);  // 支出累计正值
      } else if (record.type === 'income') {
        incomeTotal += Math.abs(record.amount);    // 收入累计正值
      }
    }
  }

  // 根据实际情况展示
  let amountStr = '';
  if (expenseTotal > 0 && incomeTotal > 0) {
    amountStr = `支出 ¥${expenseTotal}，收入 ¥${incomeTotal}`;
  } else if (expenseTotal > 0) {
    amountStr = `¥${expenseTotal}`;
  } else if (incomeTotal > 0) {
    amountStr = `¥${incomeTotal}`;
  } else {
    amountStr = '¥0';
  }

  return `${result.answer}，共 ${amountStr}`;
}
```

**金额计算逻辑**：
- `expense`：累加绝对值（展示为正数，如 ¥150）
- `income`：累加绝对值（展示为正数，如 ¥5000）
- 兼有时分开展示：支出 ¥150，收入 ¥5000

### 4.4 对比分析查询

```typescript
async function analyzeCompareQuery(
  text: string,
  records: TransactionRecord[],
  categories: CategoryInfo[],
  primary: TimeRange,
  secondary: TimeRange
): Promise<string> {
  // 分别在两个时间范围内执行单范围分析
  const primaryFiltered = filterRecords(records, primary);
  const secondaryFiltered = filterRecords(records, secondary);

  const primaryList = buildTransactionList(primaryFiltered);
  const secondaryList = buildTransactionList(secondaryFiltered);

  // 构建对比 prompt，让 AI 识别用户问的是 expense 还是 income
  const comparePrompt = `用户问题：${text}

时间范围 A：${primary.label}（${primary.start} 至 ${primary.end}）
符合该时间范围的交易记录（共 ${primaryFiltered.length} 条）：
${primaryList}

时间范围 B：${secondary.label}（${secondary.start} 至 ${secondary.end}）
符合该时间范围的交易记录（共 ${secondaryFiltered.length} 条）：
${secondaryList}

请分析上述记录，回答用户的问题。

重要规则：
1. 判断用户问的是支出还是收入（问"花了多少"→支出，问"收入"→收入）
2. 只返回匹配的记录索引，格式为 JSON：{"primaryIndexes": [...], "secondaryIndexes": [...]}
3. 不要进行任何金额计算`;

  const result = await callMiniMaxAI(comparePrompt);
  const { primaryIndexes, secondaryIndexes } = result;

  // 代码确定性计算
  const primaryTotal = sumByIndexes(primaryFiltered, primaryIndexes);
  const secondaryTotal = sumByIndexes(secondaryFiltered, secondaryIndexes);

  const diff = primaryTotal - secondaryTotal;
  const trend = diff > 0 ? '增加' : diff < 0 ? '减少' : '持平';
  const label = primaryTotal > 0 && secondaryTotal > 0 ? '共' : '';

  return `${primary.label}${label} ${primaryTotal}，${secondary.label}${label} ${secondaryTotal}，${trend}了 ${Math.abs(diff)}`;
}

function sumByIndexes(records: TransactionRecord[], indexes: number[]): number {
  let total = 0;
  for (const idx of indexes) {
    if (idx >= 0 && idx < records.length) {
      total += Math.abs(records[idx].amount);
    }
  }
  return total;
}
```

### 4.5 语义匹配策略

| 用户问法 | AI 匹配方式 |
|---------|------------|
| "奶茶花了多少" | 关键词"奶茶"匹配"奶茶/咖啡"分类 |
| "餐饮花了多少" | 匹配一级分类"餐饮"及所有二级分类 |
| "工资收到了吗" | 匹配 income 类型中含"工资"的分类 |
| "这个月比上个月" | 走对比模式：主时间范围 + 上一时间范围 |

## 5. 多轮对话支持

### 5.1 上下文存储

在 `AIPage.tsx` 的组件 state 中维护：

```typescript
interface AnalysisContext {
  lastQuery?: string;        // 上次问题
  lastTimeRange?: TimeRange; // 上次时间范围
  lastCategory?: string;      // 上次查询的分类
  lastResult?: string;       // 上次分析结果
  consecutiveFailures?: number; // 连续分类失败次数
}
```

### 5.2 获取上一时间段

在 `lib/date-parser.ts` 中新增 `getPreviousPeriod(range: TimeRange): TimeRange`：

```typescript
import { subMonths, parseISO, startOfMonth, endOfMonth, format } from 'date-fns';

export function getPreviousPeriod(range: TimeRange): TimeRange {
  const startDate = parseISO(range.start);
  const p = subMonths(startDate, 1);
  return {
    start: format(startOfMonth(p), 'yyyy-MM-dd'),
    end: format(endOfMonth(p), 'yyyy-MM-dd'),
    label: format(p, 'yyyy年M月')
  };
}
```

### 5.3 上下文继承规则

用”比”（或”对比”、”和”）将句子切分为两部分，分别解析时间范围：

```typescript
interface AnalysisTimeContext {
  mode: 'single' | 'compare';
  primary: TimeRange;
  secondary?: TimeRange;
}

function getAnalysisTimeContext(text: string, context: AnalysisContext): AnalysisTimeContext | null {
  // 对比查询：本月比上月、上个月和上上个月对比
  const compareSplit = text.split(/(比|对比|和)/);

  if (compareSplit.length === 3) {
    // 有对比词：parts[0]=”本月”，parts[1]=”比”，parts[2]=”上月”
    const primary = parseTime(compareSplit[0].trim());
    const secondary = parseTime(compareSplit[2].trim());

    if (primary && secondary) {
      return { mode: 'compare', primary, secondary };
    }
    // 解析失败，fallthrough 到 single 模式
  }

  // 非对比查询：直接解析整个字符串的时间范围
  const single = parseTime(text);
  const primary = single || context.lastTimeRange;

  if (!primary) {
    return null;
  }

  return { mode: 'single', primary };
}
```

**语义清晰**：”比”前的部分是被问的时间（primary），”比”后的部分是对比基准（secondary）。

### 5.4 上下文更新

分析完成后，使用展开运算符更新 context，保留其他字段：

```typescript
async function handleAnalysis(text: string) {
  const intent = await classifyIntent(text);

  // 分类失败时计数
  if (intent === null) {
    const failures = (analysisContext.consecutiveFailures || 0) + 1;
    setAnalysisContext(prev => ({
      ...prev,
      consecutiveFailures: failures
    }));

    if (failures >= 2) {
      return "抱歉，无法识别您的意图，请换个说法，比如'记账'或'查询'";
    }
    return "请再说一次，或者明确说是'记账'还是'查询'";
  }

  // 分类成功，重置失败计数
  setAnalysisContext(prev => ({
    ...prev,
    consecutiveFailures: 0
  }));

  if (intent !== 'analysis') {
    // 走记账流程
    return;
  }

  const timeContext = getAnalysisTimeContext(text, analysisContext);
  if (!timeContext) {
    return "请告诉我您想查询的时间范围，比如'这个月'或'3月份'";
  }

  const result = timeContext.mode === 'compare'
    ? await analyzeCompareQuery(
        text,
        records,
        categories,
        timeContext.primary,
        timeContext.secondary!
      )
    : await analyzeQuery(
        text,
        records,
        categories,
        timeContext.primary
      );

  setAnalysisContext(prev => ({
    ...prev,
    lastQuery: text,
    lastTimeRange: timeContext.primary,
    lastResult: result,
  }));

  return result;
}
```

### 5.5 上下文刷新条件

以下情况**清除** context：
- 用户发送新的录音/文字（进入新的对话轮次，且不是追问）
- 用户明确说了新的时间范围
- 页面切换或关闭

## 6. 分析结果渲染

### 6.1 消息类型

在 `AIChatArea.tsx` 新增 `analysis_result` 消息类型：

```typescript
type MessageType = 'user' | 'ai' | 'recording' | 'analysis_result';

// analysis_result 消息结构
interface AnalysisResultMessage {
  id: string;
  type: 'analysis_result';
  content: string;     // AI 返回的自然语言回答（含代码计算的金额）
  timeRange: TimeRange;
  query: string;       // 用户原始问题
}
```

### 6.2 渲染方式

```tsx
// AIChatArea.tsx
{message.type === 'analysis_result' && (
  <div className="analysis-result-card">
    <div className="query">{message.query}</div>
    <div className="result">{message.content}</div>
    <div className="time-range">{message.timeRange.label}</div>
  </div>
)}
```

## 7. 风险应对

### 7.1 意图分类边界模糊

- 使用 MiniMax API 做语义理解
- API 失败时返回 `null`，累积失败 2 次后提示用户
- 不默认走 recording，避免错误记账

### 7.2 时间解析歧义

- 规则按优先级排序（"上上月"在"上月"前）
- 使用 `text.match()` 提取时间词
- 无法解析时返回 `null`，从 context 推断或要求用户确认

### 7.3 转账记录重复计算

- 预过滤时排除 `type=transfer` 的记录

### 7.4 余额查询复杂性

- 余额查询单独处理，从 `channels.balance` 读取

### 7.5 多轮对话上下文丢失

- 使用 `setAnalysisContext(prev => ({ ...prev, ...更新 }))` 保留其他字段
- 分析完成后更新 context
- 明确上下文刷新条件

### 7.6 Token 数量风险

- 时间预过滤后，最多传 500 条
- 截断前按日期倒序排序

### 7.7 AI 计算错误

- AI 只做语义匹配，返回匹配的记录索引
- 金额 sum 由代码确定性计算
- AI answer 不含金额，避免冲突

## 8. 文件结构

```
lib/
├── ai-analysis.ts      # 分析查询主逻辑
│   ├── filterRecords()          # 预过滤（时间+转账排除+排序+上限）
│   ├── buildTransactionList()  # 构建传输文本（带索引）
│   ├── analyzeQuery()          # 单时间范围分析（AI匹配+代码计算）
│   ├── analyzeCompareQuery()   # 双时间范围对比分析
│   └── queryBalance()          # 余额查询
│
├── date-parser.ts      # 时间解析
│   ├── parseTime(text): TimeRange | null        # 单个时间词解析
│   └── getPreviousPeriod(range): TimeRange      # 获取上一时间段
│
└── minimax.ts         # 修改
    └── classifyIntent(text): Promise<Intent | null>  # 新增
```

## 9. 错误处理

### 9.1 classifyIntent

- 超时 10s：返回 `null`
- HTTP 错误：返回 `null`
- 解析失败：返回 `null`
- 调用方处理：累积失败计数，超过 2 次提示用户

### 9.2 analyzeQuery

- API 失败：抛出异常，由调用方处理
- 数据为空：返回"没有找到符合条件的记录"

### 9.3 parseTime

- 无法解析：返回 `null`，由调用方决定如何处理

## 10. 实现顺序

1. **Phase 1**：`lib/date-parser.ts` + `lib/ai-analysis.ts` + `classifyIntent`
2. **Phase 2**：修改 `AIPage.tsx` 路由 + `AIChatArea.tsx` 支持分析结果
3. **Phase 3**：可选图表集成（recharts）



