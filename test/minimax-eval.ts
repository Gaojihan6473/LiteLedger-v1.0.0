/**
 * MiniMax AI 记账解析评测脚本
 *
 * 运行方式（需要先安装 tsx）：
 *   npx tsx test/minimax-eval.ts
 */

import { analyzeTransaction, ParsedTransaction, CategoryInfo, ChannelInfo } from '../lib/minimax';

// ============ 测试数据 ============

const TEST_CATEGORIES: CategoryInfo[] = [
  { name: '餐饮', subCategories: ['早餐', '午餐', '晚餐', '快餐', '小吃', '水果', '生鲜'] },
  { name: '购物', subCategories: ['日用品', '服装', '电子产品', '美妆'] },
  { name: '交通', subCategories: ['公交', '地铁', '打车', '停车', '油费'] },
  { name: '住房', subCategories: ['房租', '水电', '物业', '维修'] },
  { name: '医疗', subCategories: ['门诊', '药品', '体检'] },
  { name: '教育', subCategories: ['培训', '教材', '学费'] },
  { name: '娱乐', subCategories: ['电影', '游戏', '旅游', '健身'] },
  { name: '通讯', subCategories: ['话费', '流量'] },
  { name: '工资', subCategories: [] },
  { name: '红包', subCategories: [] },
  { name: '转账', subCategories: ['转入', '转出'] },
];

const TEST_CHANNELS: ChannelInfo[] = [
  { name: '微信钱包' },
  { name: '支付宝' },
  { name: '建设银行' },
  { name: '招商银行' },
  { name: '工商银行' },
  { name: '农业银行' },
  { name: '现金' },
];

// ============ 测试用例 ============

interface TestCase {
  input: string;
  description: string;
  expectedType?: 'expense' | 'income' | 'transfer';
  expectedCategory?: string;
  expectedSubCategory?: string;
  expectedChannel?: string;
  expectedNote?: string;
  evaluationCriteria?: string;
}

const TEST_CASES: TestCase[] = [
  // ===== 简略信息测试（应优先匹配二级分类） =====
  {
    input: '早上花了五块钱吃早饭，用的微信',
    description: '简略信息 - 应匹配现有二级分类',
    expectedType: 'expense',
    expectedCategory: '餐饮',
    expectedSubCategory: '早餐',
    expectedChannel: '微信钱包',
    expectedNote: '',
    evaluationCriteria: 'subCategory 应该是"早餐"而不是"早饭"，note 为空'
  },
  {
    input: '买水果花了20',
    description: '简略信息 - 水果应有对应二级分类',
    expectedType: 'expense',
    expectedCategory: '餐饮',
    expectedSubCategory: '水果',
    expectedChannel: '',
    expectedNote: '',
    evaluationCriteria: 'subCategory 应匹配"水果"二级分类'
  },
  {
    input: '中午吃了碗面，花了15',
    description: '简略信息 - 面食归类',
    expectedType: 'expense',
    expectedCategory: '餐饮',
    expectedSubCategory: '午餐',
    expectedChannel: '',
    expectedNote: '',
    evaluationCriteria: 'subCategory 应为"午餐"或"快餐"，note 简短或为空'
  },
  {
    input: '打了个车花了30',
    description: '简略信息 - 打车应有对应二级分类',
    expectedType: 'expense',
    expectedCategory: '交通',
    expectedSubCategory: '打车',
    expectedChannel: '',
    expectedNote: '',
    evaluationCriteria: 'subCategory 应匹配"打车"二级分类'
  },
  {
    input: '买了件衣服花了200',
    description: '简略信息 - 服装应有对应二级分类',
    expectedType: 'expense',
    expectedCategory: '购物',
    expectedSubCategory: '服装',
    expectedChannel: '',
    expectedNote: '',
    evaluationCriteria: 'subCategory 应匹配"服装"二级分类'
  },
  {
    input: '充了50话费',
    description: '简略信息 - 话费应有对应二级分类',
    expectedType: 'expense',
    expectedCategory: '通讯',
    expectedSubCategory: '话费',
    expectedChannel: '',
    expectedNote: '',
    evaluationCriteria: 'subCategory 应匹配"话费"二级分类'
  },

  // ===== 丰富信息测试（应提取核心内容到备注） =====
  {
    input: '中午和同事一起在海底捞吃了顿火锅，花了200，用的招商银行',
    description: '丰富信息 - 具体店铺写入备注',
    expectedType: 'expense',
    expectedCategory: '餐饮',
    expectedSubCategory: '午餐',
    expectedChannel: '招商银行',
    expectedNote: '海底捞火锅',
    evaluationCriteria: 'subCategory 可为"午餐"，note 应包含"海底捞火锅"'
  },
  {
    input: '今天去超市买了些蔬菜和肉类，一共花了80，微信付款',
    description: '丰富信息 - 超市购物写入备注',
    expectedType: 'expense',
    expectedCategory: '餐饮',
    expectedSubCategory: '生鲜',
    expectedChannel: '微信钱包',
    expectedNote: '超市蔬菜肉类',
    evaluationCriteria: 'subCategory 可为"生鲜"，note 应包含购物内容'
  },
  {
    input: '下午带孩子去游乐场玩，花了150，用的支付宝',
    description: '丰富信息 - 游乐场写入备注',
    expectedType: 'expense',
    expectedCategory: '娱乐',
    expectedSubCategory: '旅游',
    expectedChannel: '支付宝',
    expectedNote: '游乐场',
    evaluationCriteria: 'subCategory 可为"旅游"，note 应包含"游乐场"'
  },
  {
    input: '周末和女朋友去看了场电影，还喝了杯奶茶，一共花了100，现金支付的',
    description: '丰富信息 - 电影和奶茶写入备注',
    expectedType: 'expense',
    expectedCategory: '娱乐',
    expectedSubCategory: '电影',
    expectedChannel: '现金',
    expectedNote: '电影、奶茶',
    evaluationCriteria: 'subCategory 可为"电影"，note 应包含"电影"和"奶茶"'
  },

  // ===== 收入测试 =====
  {
    input: '发工资了，3000块到账招商银行',
    description: '工资收入',
    expectedType: 'income',
    expectedCategory: '工资',
    expectedChannel: '招商银行',
    expectedNote: '',
    evaluationCriteria: 'type 应为 income，category 应为"工资"'
  },
  {
    input: '收了个红包100',
    description: '红包收入',
    expectedType: 'income',
    expectedCategory: '红包',
    expectedNote: '收红包',
    evaluationCriteria: 'type 应为 income，category 应为"红包"'
  },

  // ===== 转账测试 =====
  {
    input: '从微信钱包转账了200块钱到中国银行',
    description: '转账 - 微信到银行',
    expectedType: 'transfer',
    expectedChannel: '微信钱包',
    expectedToChannel: '中国银行',
    evaluationCriteria: 'type 应为 transfer，注意账户名称精确匹配'
  },
  {
    input: '从建设银行转1000到农业银行',
    description: '转账 - 银行间转账',
    expectedType: 'transfer',
    expectedChannel: '建设银行',
    expectedToChannel: '农业银行',
    evaluationCriteria: 'type 应为 transfer'
  },

  // ===== 边界情况 =====
  {
    input: '今天休息没花钱',
    description: '无消费记录',
    evaluationCriteria: 'amount 应为空或 0，表示未识别到有效消费'
  },
  {
    input: '随便买了点东西花了50',
    description: '信息模糊 - 买东西',
    expectedType: 'expense',
    expectedNote: '买东西',
    evaluationCriteria: 'note 应保留"买东西"或类似描述'
  },
];

// ============ 评测逻辑 ============

function printSeparator(text: string) {
  console.log('\n' + '='.repeat(60));
  console.log(text);
  console.log('='.repeat(60));
}

function printTestCase(index: number, testCase: TestCase, result: ParsedTransaction | null) {
  console.log(`\n【测试 ${index + 1}】${testCase.description}`);
  console.log(`输入: "${testCase.input}"`);
  if (testCase.evaluationCriteria) {
    console.log(`评估标准: ${testCase.evaluationCriteria}`);
  }
  console.log(`期望: type=${testCase.expectedType || '?'}, category=${testCase.expectedCategory || '?'}, subCategory=${testCase.expectedSubCategory || '?'}, channel=${testCase.expectedChannel || '?'}, note="${testCase.expectedNote || ''}"`);
  console.log(`实际: type=${result?.type || '?'}, category=${result?.category || '?'}, subCategory=${result?.subCategory || '?'}, channel=${result?.channel || '?'}, note="${result?.note || ''}"`);

  // 简单评分
  let score = 0;
  let total = 0;
  if (testCase.expectedType) {
    total++;
    if (result?.type === testCase.expectedType) score++;
  }
  if (testCase.expectedCategory) {
    total++;
    if (result?.category === testCase.expectedCategory) score++;
  }
  if (testCase.expectedSubCategory !== undefined) {
    total++;
    if (result?.subCategory === testCase.expectedSubCategory) score++;
  }
  if (testCase.expectedChannel !== undefined) {
    total++;
    if (result?.channel === testCase.expectedChannel) score++;
  }
  if (testCase.expectedNote !== undefined) {
    total++;
    // note 允许部分匹配
    if (result?.note?.includes(testCase.expectedNote) || testCase.expectedNote === '') {
      score++;
    }
  }

  const pass = total > 0 && score === total;
  console.log(`结果: ${pass ? '✅ 通过' : '❌ 未通过'} (${score}/${total})`);
  return pass;
}

// ============ 运行测试 ============

async function runTests() {
  printSeparator('MiniMax AI 记账解析 API 评测');
  console.log(`\n测试分类数: ${TEST_CATEGORIES.length}`);
  console.log(`测试渠道数: ${TEST_CHANNELS.length}`);
  console.log(`测试用例数: ${TEST_CASES.length}`);

  const results: boolean[] = [];

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    try {
      console.log(`\n正在测试 ${i + 1}/${TEST_CASES.length}...`);
      const result = await analyzeTransaction(tc.input, TEST_CATEGORIES, TEST_CHANNELS);
      const passed = printTestCase(i, tc, result);
      results.push(passed);
    } catch (error) {
      console.log(`\n【测试 ${i + 1}】${tc.description}`);
      console.log(`输入: "${tc.input}"`);
      console.log(`❌ 错误: ${error instanceof Error ? error.message : String(error)}`);
      results.push(false);
    }

    // 添加延迟避免 API 限流
    if (i < TEST_CASES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 汇总
  printSeparator('评测结果汇总');
  const passedCount = results.filter(r => r).length;
  console.log(`通过: ${passedCount}/${TEST_CASES.length}`);
  console.log(`未通过: ${TEST_CASES.length - passedCount}/${TEST_CASES.length}`);

  // 列出未通过的测试
  if (passedCount < TEST_CASES.length) {
    console.log('\n未通过的测试:');
    results.forEach((r, i) => {
      if (!r) {
        console.log(`  - ${i + 1}. ${TEST_CASES[i].description}`);
      }
    });
  }
}

runTests().catch(console.error);
