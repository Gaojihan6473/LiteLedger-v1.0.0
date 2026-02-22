// 用户信息
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
}

// 验证码记录（本地模拟）
export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: number;
}

// 认证状态
export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sendVerificationCode: (email: string) => Promise<{ success: boolean, error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean, error?: string }>;
  checkAuth: () => Promise<boolean>;
}

// 验证规则
export const VALIDATION_RULES = {
  username: {
    minLength: 3,
    maxLength: 15,
    pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/,
  },
  password: {
    minLength: 6,
    maxLength: 20,
  },
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  verificationCode: 6,
  codeExpiry: 5 * 60 * 1000, // 5分钟
} as const;
