# 类型与常量模块 (Types & Constants)

核心数据类型和常量定义。

## 类型文件

- [types.ts](types.ts) - 数据模型类型
- [types/auth.ts](types/auth.ts) - 认证类型
- [constants.ts](constants.ts) - 默认分类/渠道常量

## types.ts 类型

### TransactionType
```typescript
type TransactionType = 'expense' | 'income' | 'transfer';
```

### Category
```typescript
interface Category {
  id: string; name: string; iconName: string;
  type: TransactionType; color?: string;
  subCategories?: SubCategory[];
}
```

### Channel
```typescript
interface Channel {
  id: string; name: string; iconName: string;
  color?: string; balance: number;
}
```

### TransactionRecord
```typescript
interface TransactionRecord {
  id: string; amount: number; categoryId: string;
  subCategoryId?: string; channelId?: string; toChannelId?: string;
  type: TransactionType; date: string; note?: string;
  createdAt: number;
  isInitialBalance?: boolean; // 初始余额标记，不计入统计
}
```

## types/auth.ts

### VALIDATION_RULES
```typescript
const VALIDATION_RULES = {
  username: { minLength: 3, maxLength: 15 },
  password: { minLength: 6, maxLength: 20 },
  email: /正则/,
  verificationCode: 6,
  codeExpiry: 5 * 60 * 1000
};
```

## constants.ts 默认数据

### 分类 (24个)
- 支出：16 个（餐饮、交通、购物、居住等）
- 收入：7 个（工资、经营、投资等）
- 转账：1 个

### 渠道 (14个)
微信、支付宝、现金、公交卡、各大银行、医保卡、信用卡、花呗、股票、基金

## 开发注意

1. 数据库类型 (Db*) 与前端类型分开
2. 前端 camelCase，数据库 snake_case
3. 颜色使用十六进制 #RRGGBB
4. 图标使用 lucide-react
5. 默认值在 constants.ts，首次登录通过 `initDefaultData()` 插入
