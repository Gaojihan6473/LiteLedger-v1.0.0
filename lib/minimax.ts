// MiniMax 文字分析服务
// 用于将语音转文字的结果智能解析为记账信息

const API_KEY = 'sk-cp-6TDsbjMBKXB3KNlJJ1Y1RP8zxUZys89thF5IkAkjFXn5jYlPqtVQubpWOdt8LO_OzHFEX3eU0eQF2LY9R8BvjEcUWN8rfF5srt0HLXFX2gxnG79UxJq6AIE';
const BASE_URL = 'https://api.minimax.chat/v1';

export interface ParsedTransaction {
  type: 'expense' | 'income' | 'transfer';
  amount: number | string;  // 数字或空字符串
  category: string;
  subCategory?: string;
  channel: string;
  toChannel?: string;  // 转账目标账户
  date: string;
  note: string;
}

export interface CategoryInfo {
  name: string;
  subCategories?: string[];
}

export interface ChannelInfo {
  name: string;
}

// 解析 AI 返回的 JSON
function parseAIResponse(text: string): ParsedTransaction | null {
  try {
    // 尝试直接解析
    const cleaned = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(cleaned);

    if (parsed.type && parsed.amount !== undefined && parsed.category && parsed.channel) {
      let type: 'expense' | 'income' | 'transfer';
      if (parsed.type === 'transfer') {
        type = 'transfer';
      } else if (parsed.type === 'income') {
        type = 'income';
      } else {
        type = 'expense';
      }

      return {
        type,
        amount: parseFloat(parsed.amount) || '',  // 金额为空表示未识别
        category: parsed.category || '',           // 分类为空表示未识别
        subCategory: parsed.subCategory || undefined,
        channel: parsed.channel || '',            // 渠道为空表示未识别
        toChannel: parsed.toChannel || undefined,
        date: parsed.date || '',                   // 空字符串由前端处理默认今天
        note: parsed.note || '',
      };
    }
  } catch (e) {
    console.error('Parse AI response error:', e);
  }
  return null;
}

// 获取今天的日期
function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 构建 prompt
function buildPrompt(text: string, categories: CategoryInfo[], channels: ChannelInfo[]): string {
  const categoryList = categories.map(c => {
    if (c.subCategories && c.subCategories.length > 0) {
      return `${c.name}（含二级分类：${c.subCategories.join('、')}）`;
    }
    return c.name;
  }).join('\n');

  const channelList = channels.map(ch => ch.name).join('、');

  return `你是一个智能记账助手，请从用户语音中提取记账信息，严格按照JSON格式输出。

【可选分类】
${categoryList}

【可选账户】（必须从中选择匹配的账户名称）
${channelList}

【三种记账类型定义】
1. expense(支出)：钱从账户流出用于消费，如吃饭、购物、交费等
2. income(收入)：钱流入到某个账户，如工资、收款、退款等
3. transfer(转账)：钱从一个账户转到另一个账户，如从微信转钱到银行卡

【字段说明】
- type: 交易类型，只能是 expense、income 或 transfer 之一
- amount: 金额（数字）
- category: 支出/收入对应的分类（如餐饮、交通、工资等），转账类型填"转账"
- subCategory: 二级分类（可选）
- channel: 【重要】账户/渠道名称
  - 支出时：支付渠道（如支付宝、微信）
  - 收入时：收款渠道（如银行卡、微信）
  - 【转账时：转出账户（钱从哪里转出），必须填写】
- toChannel: 【转账时必须填写】转入账户（钱转到哪里）
- date: 日期，格式 YYYY-MM-DD（未提及则用今天：${getTodayDate()}）
- note: 备注（仅包含转账说明之外的其他信息）

【转账类型识别规则】（非常重要！）
只要语音中提到两个账户之间的资金流动，就是转账：
- "从A转到B"、"从A转账到B" → channel=A, toChannel=B
- "转B 100块"、"给B转100" → channel=你的默认账户（需根据语境判断）, toChannel=B
- "从微信提现到银行卡" → channel=微信, toChannel=银行卡
- "把A的钱转到B" → channel=A, toChannel=B
- "充值100到B账户" → channel=你的默认账户, toChannel=B
- "从余额转出" → channel=默认账户, toChannel=目标账户

注意：如果只提到一个账户的支出（如"花了100"），且没有明确说"转到"、"转账给"等，则视为支出而非转账。

【必须使用以下精确账户名称】
${channelList}
注意：只能说上述列表中的精确名称！比如只能说"微信钱包"不能说"微信"，只能说"工商银行"不能说"工行"或"银行卡"。

【示例】
用户说："今天从微信钱包转账了200块钱到中国银行"
正确输出：{"type":"transfer","amount":200,"category":"转账","channel":"微信钱包","toChannel":"中国银行","date":"${getTodayDate()}","note":""}

用户说："从支付宝转500到招商银行"
正确输出：{"type":"transfer","amount":500,"category":"转账","channel":"支付宝","toChannel":"招商银行","date":"${getTodayDate()}","note":""}

用户说："微信提现300到工商银行"
正确输出：{"type":"transfer","amount":300,"category":"转账","channel":"微信钱包","toChannel":"工商银行","date":"${getTodayDate()}","note":""}

用户说："从建设银行转1000到农业银行"
正确输出：{"type":"transfer","amount":1000,"category":"转账","channel":"建设银行","toChannel":"农业银行","date":"${getTodayDate()}","note":""}

用户说："今天早上吃饭花了50块钱，用微信支付的"
正确输出：{"type":"expense","amount":50,"category":"餐饮","channel":"微信钱包","date":"${getTodayDate()}","note":"早上吃饭"}

用户说："发工资了，3000块到账招商银行"
正确输出：{"type":"income","amount":3000,"category":"工资","channel":"招商银行","date":"${getTodayDate()}","note":""}

用户说："中午点了外卖花了35元，支付宝付款"
正确输出：{"type":"expense","amount":35,"category":"餐饮","channel":"支付宝","date":"${getTodayDate()}","note":"中午外卖"}

用户说："房租2000用建设银行转账"
正确输出：{"type":"expense","amount":2000,"category":"住房","channel":"建设银行","date":"${getTodayDate()}","note":"房租"}

用户说："今天休息没花钱"
正确输出：{"type":"expense","amount":"","category":"","channel":"","date":"${getTodayDate()}","note":""}

用户说："收了个红包100"
正确输出：{"type":"income","amount":100,"category":"红包","channel":"","date":"${getTodayDate()}","note":"收红包"}

用户说："买水果花了20"
正确输出：{"type":"expense","amount":20,"category":"","channel":"","date":"${getTodayDate()}","note":"买水果"}

用户语音文本：${text}

请严格按照JSON格式输出，不要包含其他内容，不要有任何解释。`}

// 调用 MiniMax API
export async function analyzeTransaction(
  text: string,
  categories: CategoryInfo[],
  channels: ChannelInfo[]
): Promise<ParsedTransaction | null> {
  if (!text.trim()) {
    return null;
  }

  const prompt = buildPrompt(text, categories, channels);

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
          {
            role: 'system',
            content: '你是一个智能记账助手，擅长从用户的语音或文字中提取记账信息。请严格按照JSON格式输出。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('MiniMax API error:', error);
      return null;
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message.content;
      return parseAIResponse(content);
    }

    return null;
  } catch (error) {
    console.error('Analyze transaction error:', error);
    return null;
  }
}
