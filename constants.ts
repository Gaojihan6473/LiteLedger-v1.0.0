
import { Category, Channel } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense
  { 
    id: 'c1', 
    name: '餐饮', 
    iconName: 'Utensils', 
    type: 'expense', 
    color: '#EF4444',
    subCategories: [
      { id: 'c1_1', name: '早餐' },
      { id: 'c1_2', name: '午餐' },
      { id: 'c1_3', name: '晚餐' },
      { id: 'c1_4', name: '夜宵' },
      { id: 'c1_5', name: '外卖' },
      { id: 'c1_6', name: '咖啡/奶茶' },
      { id: 'c1_7', name: '食材采购' },
    ]
  },
  { 
    id: 'c2', 
    name: '交通', 
    iconName: 'Bus', 
    type: 'expense', 
    color: '#F59E0B',
    subCategories: [
      { id: 'c2_1', name: '公交/地铁' },
      { id: 'c2_2', name: '打车/网约车' },
      { id: 'c2_3', name: '自驾油费' },
      { id: 'c2_4', name: '停车费' },
      { id: 'c2_5', name: '高速过路费' },
      { id: 'c2_6', name: '火车' },
      { id: 'c2_7', name: '飞机' },
      { id: 'c2_8', name: '共享单车' },
    ]
  },
  { 
    id: 'c3', 
    name: '购物', 
    iconName: 'ShoppingBag', 
    type: 'expense', 
    color: '#EC4899',
    subCategories: [
      { id: 'c3_1', name: '服装鞋帽' },
      { id: 'c3_2', name: '数码产品' },
      { id: 'c3_3', name: '家电' },
      { id: 'c3_4', name: '日用品' },
      { id: 'c3_5', name: '美妆护肤' },
      { id: 'c3_6', name: '母婴用品' },
      { id: 'c3_7', name: '宠物用品' },
      { id: 'c3_8', name: '家居用品' },
    ]
  },
  { 
    id: 'c4', 
    name: '居住', 
    iconName: 'Home', 
    type: 'expense', 
    color: '#6366F1',
    subCategories: [
        { id: 'c4_1', name: '房租' },
        { id: 'c4_2', name: '房贷' },
        { id: 'c4_3', name: '水费' },
        { id: 'c4_4', name: '电费' },
        { id: 'c4_5', name: '燃气费' },
        { id: 'c4_6', name: '物业费' },
        { id: 'c4_7', name: '宽带费' },
        { id: 'c4_8', name: '家政服务' },
    ]
  },
  { 
    id: 'c5', 
    name: '娱乐', 
    iconName: 'Gamepad2', 
    type: 'expense', 
    color: '#8B5CF6',
    subCategories: [
        { id: 'c5_1', name: '电影' },
        { id: 'c5_2', name: '游戏' },
        { id: 'c5_3', name: 'KTV' },
        { id: 'c5_4', name: '旅游' },
        { id: 'c5_5', name: '演出/音乐节' },
        { id: 'c5_6', name: '运动健身' },
        { id: 'c5_7', name: '桌游/剧本杀' },
        { id: 'c5_8', name: '会员订阅' },
    ]
  },
  { 
    id: 'c6', 
    name: '医疗', 
    iconName: 'Stethoscope', 
    type: 'expense', 
    color: '#10B981',
    subCategories: [
        { id: 'c6_1', name: '门诊' },
        { id: 'c6_2', name: '住院' },
        { id: 'c6_3', name: '药品' },
        { id: 'c6_4', name: '体检' },
        { id: 'c6_5', name: '疫苗' },
        { id: 'c6_6', name: '保健品' },
        { id: 'c6_7', name: '牙科' },
        { id: 'c6_8', name: '医疗器械' },
    ]
  },
  { 
    id: 'c7', 
    name: '教育', 
    iconName: 'GraduationCap', 
    type: 'expense', 
    color: '#3B82F6',
    subCategories: [
        { id: 'c7_1', name: '学费' },
        { id: 'c7_2', name: '培训班' },
        { id: 'c7_3', name: '书籍' },
        { id: 'c7_4', name: '在线课程' },
        { id: 'c7_5', name: '考试报名费' },
        { id: 'c7_6', name: '证书认证' },
        { id: 'c7_7', name: '学习资料' },
        { id: 'c7_8', name: '兴趣班' },
    ]
  },
  { 
    id: 'c8', 
    name: '金融理财', 
    iconName: 'CreditCard', 
    type: 'expense', 
    color: '#F97316',
    subCategories: [
        { id: 'c8_1', name: '银行手续费' },
        { id: 'c8_2', name: '信用卡还款' },
        { id: 'c8_3', name: '投资（基金/股票）' },
        { id: 'c8_4', name: '保险支出' },
        { id: 'c8_5', name: '理财产品' },
        { id: 'c8_6', name: '借款还款' },
        { id: 'c8_7', name: '分期付款' },
        { id: 'c8_8', name: '利息支出' },
    ]
  },
  { 
    id: 'c9', 
    name: '通讯网络', 
    iconName: 'Wifi', 
    type: 'expense', 
    color: '#06B6D4',
    subCategories: [
        { id: 'c9_1', name: '手机话费' },
        { id: 'c9_2', name: '流量充值' },
        { id: 'c9_3', name: '宽带' },
        { id: 'c9_4', name: '云服务' },
        { id: 'c9_5', name: '软件订阅' },
        { id: 'c9_6', name: 'VPN' },
        { id: 'c9_7', name: '办公协作工具' },
    ]
  },
  { 
    id: 'c10', 
    name: '人情往来', 
    iconName: 'Gift', 
    type: 'expense', 
    color: '#E11D48',
    subCategories: [
        { id: 'c10_1', name: '红包' },
        { id: 'c10_2', name: '礼金' },
        { id: 'c10_3', name: '生日礼物' },
        { id: 'c10_4', name: '节日礼物' },
        { id: 'c10_5', name: '请客送礼' },
        { id: 'c10_6', name: '婚丧礼金' },
        { id: 'c10_7', name: '探望礼品' },
    ]
  },
  { 
    id: 'c11', 
    name: '家庭支出', 
    iconName: 'Users', 
    type: 'expense', 
    color: '#84CC16',
    subCategories: [
        { id: 'c11_1', name: '子女抚养' },
        { id: 'c11_2', name: '老人赡养' },
        { id: 'c11_3', name: '家庭医疗' },
        { id: 'c11_4', name: '家庭保险' },
        { id: 'c11_5', name: '家庭旅游' },
        { id: 'c11_6', name: '家庭用品' },
    ]
  },
  { 
    id: 'c12', 
    name: '宠物', 
    iconName: 'Cat', 
    type: 'expense', 
    color: '#A855F7',
    subCategories: [
        { id: 'c12_1', name: '宠物食品' },
        { id: 'c12_2', name: '医疗' },
        { id: 'c12_3', name: '洗护' },
        { id: 'c12_4', name: '玩具' },
        { id: 'c12_5', name: '寄养' },
        { id: 'c12_6', name: '宠物保险' },
    ]
  },
  { 
    id: 'c13', 
    name: '税费', 
    iconName: 'FileText', 
    type: 'expense', 
    color: '#475569',
    subCategories: [
        { id: 'c13_1', name: '个人所得税' },
        { id: 'c13_2', name: '社保' },
        { id: 'c13_3', name: '公积金' },
        { id: 'c13_4', name: '车辆年检' },
        { id: 'c13_5', name: '车辆保险' },
        { id: 'c13_6', name: '罚款' },
        { id: 'c13_7', name: '印花税' },
    ]
  },
  { 
    id: 'c14', 
    name: '职业发展', 
    iconName: 'Briefcase', 
    type: 'expense', 
    color: '#0D9488',
    subCategories: [
        { id: 'c14_1', name: '商务差旅' },
        { id: 'c14_2', name: '职业培训' },
        { id: 'c14_3', name: '办公设备' },
        { id: 'c14_4', name: '证书费用' },
        { id: 'c14_5', name: '行业会议' },
        { id: 'c14_6', name: '工具订阅' },
    ]
  },
  { 
    id: 'c15', 
    name: '资产购置', 
    iconName: 'Gem', 
    type: 'expense', 
    color: '#BE185D',
    subCategories: [
        { id: 'c15_1', name: '房产' },
        { id: 'c15_2', name: '车辆' },
        { id: 'c15_3', name: '大额电子设备' },
        { id: 'c15_4', name: '家具' },
        { id: 'c15_5', name: '收藏品' },
        { id: 'c15_6', name: '长期投资资产' },
    ]
  },
  { 
    id: 'c16', 
    name: '其他', 
    iconName: 'CircleDashed', 
    type: 'expense', 
    color: '#94748B', 
    subCategories: [
        { id: 'c16_1', name: '未分类' },
        { id: 'c16_2', name: '临时支出' },
        { id: 'c16_3', name: '意外支出' },
        { id: 'c16_4', name: '调账' },
        { id: 'c16_5', name: '转账' },
    ]
  },
  
  // Income
  { 
    id: 'i1', 
    name: '工资收入', 
    iconName: 'Banknote', 
    type: 'income', 
    color: '#16A34A',
    subCategories: [
      { id: 'i1_1', name: '基本工资' },
      { id: 'i1_2', name: '绩效工资' },
      { id: 'i1_3', name: '加班费' },
      { id: 'i1_4', name: '津贴补贴' },
      { id: 'i1_5', name: '年终奖' },
    ]
  },
  { 
    id: 'i2', 
    name: '经营/副业', 
    iconName: 'Laptop', 
    type: 'income', 
    color: '#0EA5E9',
    subCategories: [
      { id: 'i2_1', name: '自媒体收入' },
      { id: 'i2_2', name: '电商收入' },
      { id: 'i2_3', name: '咨询服务费' },
      { id: 'i2_4', name: '外包接单' },
      { id: 'i2_5', name: '技术服务收入' },
    ]
  },
  { 
    id: 'i3', 
    name: '投资收益', 
    iconName: 'TrendingUp', 
    type: 'income', 
    color: '#F59E0B',
    subCategories: [
      { id: 'i3_1', name: '股票收益' },
      { id: 'i3_2', name: '基金收益' },
      { id: 'i3_3', name: '银行理财收益' },
      { id: 'i3_4', name: '利息收入' },
      { id: 'i3_5', name: '分红' },
    ]
  },
  { 
    id: 'i4', 
    name: '租赁收入', 
    iconName: 'Key', 
    type: 'income', 
    color: '#8B5CF6',
    subCategories: [
      { id: 'i4_1', name: '房租' },
      { id: 'i4_2', name: '车位租金' },
      { id: 'i4_3', name: '设备出租' },
      { id: 'i4_4', name: '商铺租金' },
      { id: 'i4_5', name: '短租平台收入' },
    ]
  },
  { 
    id: 'i5', 
    name: '报销/补贴', 
    iconName: 'Receipt', 
    type: 'income', 
    color: '#10B981',
    subCategories: [
      { id: 'i5_1', name: '公司报销' },
      { id: 'i5_2', name: '政府补贴' },
      { id: 'i5_3', name: '医疗报销' },
      { id: 'i5_4', name: '保险理赔' },
      { id: 'i5_5', name: '公积金提取' },
    ]
  },
  { 
    id: 'i6', 
    name: '转账/赠与', 
    iconName: 'Gift', 
    type: 'income', 
    color: '#EC4899',
    subCategories: [
      { id: 'i6_1', name: '红包' },
      { id: 'i6_2', name: '礼金' },
      { id: 'i6_3', name: '家人资助' },
      { id: 'i6_4', name: '朋友转账' },
      { id: 'i6_5', name: '节日红包' },
    ]
  },
  {
    id: 'i7',
    name: '其他收入',
    iconName: 'CircleDashed',
    type: 'income',
    color: '#64748B',
    subCategories: [
      { id: 'i7_1', name: '二手出售' },
      { id: 'i7_2', name: '彩票中奖' },
      { id: 'i7_3', name: '退款返现' },
      { id: 'i7_4', name: '平台补偿' },
      { id: 'i7_5', name: '临时收入' },
    ]
  },

  // Transfer
  {
    id: 'transfer',
    name: '转账',
    iconName: 'ArrowLeftRight',
    type: 'transfer',
    color: '#8B5CF6',
    subCategories: [
      { id: 'transfer_in', name: '转入' },
      { id: 'transfer_out', name: '转出' },
    ]
  },
];

export const DEFAULT_CHANNELS: Channel[] = [
  { id: 'ch1', name: '微信钱包', iconName: 'MessageCircle', color: '#22C55E' },
  { id: 'ch2', name: '支付宝', iconName: 'QrCode', color: '#3B82F6' },
  { id: 'ch3', name: '现金', iconName: 'Banknote', color: '#64748B' },
  { id: 'ch4', name: '公交卡', iconName: 'Bus', color: '#06B6D4' },
  { id: 'ch5', name: '招商银行', iconName: 'CreditCard', color: '#EF4444' },
  { id: 'ch6', name: '建设银行', iconName: 'CreditCard', color: '#0284C7' },
  { id: 'ch7', name: '中国银行', iconName: 'CreditCard', color: '#B91C1C' },
  { id: 'ch8', name: '工商银行', iconName: 'CreditCard', color: '#EAB308' },
  { id: 'ch9', name: '农业银行', iconName: 'CreditCard', color: '#16A34A' },
  { id: 'ch10', name: '医保卡/社保卡', iconName: 'Shield', color: '#0EA5E9' },
  { id: 'ch11', name: '信用卡', iconName: 'CreditCard', color: '#8B5CF6' },
  { id: 'ch12', name: '花呗/白条', iconName: 'Wallet', color: '#F97316' },
  { id: 'ch13', name: '股票', iconName: 'TrendingUp', color: '#EF4444' },
  { id: 'ch14', name: '基金', iconName: 'LineChart', color: '#F59E0B' },
];
