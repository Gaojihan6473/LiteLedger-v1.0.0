import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthState } from '../types/auth';
import { getCurrentUser, signUp, signIn, signOut, resetPassword, onAuthStateChange, initDefaultData, getEmailByUsername } from '../lib/api';
import { useStore } from '../store';

const STORAGE_KEY = 'lite-ledger-auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,

      login: async (emailOrUsername, password) => {
        try {
          let email = emailOrUsername;

          // 如果不是邮箱格式，尝试查询用户名对应的邮箱
          if (!emailOrUsername.includes('@')) {
            const foundEmail = await getEmailByUsername(emailOrUsername);
            if (!foundEmail) {
              return { success: false, error: '用户名不存在' };
            }
            email = foundEmail;
          }

          const data = await signIn(email, password);

          if (data.user) {
            // 从 signIn 返回的 user 中获取信息，避免 session 同步延迟问题
            const user: User = {
              id: data.user.id,
              username: data.user.user_metadata?.username || email.split('@')[0],
              email: data.user.email || '',
              password: '',
              createdAt: new Date(data.user.created_at).getTime(),
            };
            set({ isAuthenticated: true, currentUser: user });
            return { success: true };
          }

          return { success: false, error: '登录失败' };
        } catch (error: any) {
          console.error('Login error:', error);
          return { success: false, error: error.message || '登录失败，请检查邮箱和密码' };
        }
      },

      register: async (username, email, password) => {
        try {
          const data = await signUp(email, password, username);

          if (data.user) {
            // 注册成功后自动登录
            const user = await getCurrentUser();
            if (user) {
              // 初始化默认数据
              await initDefaultData(user.id);
              set({ isAuthenticated: true, currentUser: user });
              return { success: true };
            }
            // 如果无法获取用户信息，返回失败
            return { success: false, error: '已注册成功，请回到登录页面进行登录' };
          }

          return { success: false, error: '注册失败' };
        } catch (error: any) {
          console.error('Register error:', error);
          return { success: false, error: error.message || '注册失败，请稍后重试' };
        }
      },

      logout: async () => {
        // 设置标志位，防止 onAuthStateChange 中的 SIGNED_OUT 触发无限循环
        isSigningOut = true;

        // 先同步清除本地状态，确保UI立即响应
        set({ isAuthenticated: false, currentUser: null });

        // 取消 Realtime 订阅
        useStore.getState().cleanup();

        try {
          await signOut();
        } catch (error: any) {
          console.error('Logout error:', error);
          // API 失败不影响本地状态（已清除）
        } finally {
          // 延迟重置标志位，确保 Supabase 的 SIGNED_OUT 事件不会被处理
          setTimeout(() => {
            isSigningOut = false;
          }, 1000);
        }
      },

      sendVerificationCode: async (email) => {
        try {
          await resetPassword(email);
          return { success: true };
        } catch (error: any) {
          console.error('Reset password error:', error);
          return { success: false, error: error.message || '发送失败，请稍后重试' };
        }
      },

      resetPassword: async (email, code, newPassword) => {
        // Supabase 的密码重置通过邮件链接完成
        // 本地验证码逻辑不再需要
        return { success: false, error: '请使用邮件链接重置密码' };
      },

      checkAuth: async () => {
        const state = get();
        const { currentUser, isAuthenticated } = state;

        // 如果 isAuthenticated 为 true 但 currentUser 为 null，说明状态不一致，需要重新检查
        if (isAuthenticated && !currentUser) {
          console.log('Inconsistent state detected, checking Supabase...');
          try {
            const user = await getCurrentUser();
            if (user) {
              set({ isAuthenticated: true, currentUser: user });
              await initDefaultData(user.id);
              return true;
            }
            // Supabase 会话已过期，清除本地状态
            console.log('Session expired, clearing auth state');
            set({ isAuthenticated: false, currentUser: null });
            return false;
          } catch (error) {
            console.error('Check auth error:', error);
            // 网络错误时清除状态，让用户重新登录
            set({ isAuthenticated: false, currentUser: null });
            return false;
          }
        }

        // 如果本地已有用户信息，先设置为已登录
        if (currentUser) {
          set({ isAuthenticated: true });
          // 后台尝试与 Supabase 同步
          try {
            const user = await getCurrentUser();
            if (user) {
              set({ currentUser: user });
              // 初始化默认数据（如果需要）
              await initDefaultData(user.id);
            }
            // Supabase session 过期，但保留本地登录状态
          } catch (error) {
            // 网络错误/超时 时保留本地登录状态
            console.error('Check auth sync error:', error);
          }
          return true;
        }

        // 本地没有用户信息，检查 Supabase
        try {
          const user = await getCurrentUser();
          if (user) {
            set({ isAuthenticated: true, currentUser: user });
            // 初始化默认数据（如果需要）
            await initDefaultData(user.id);
            return true;
          }
          // Supabase 也没有用户，保持未登录状态
          return false;
        } catch (error) {
          // 网络错误/超时时，不清除可能存在的登录状态
          // 等待下次 checkAuth 重试
          console.error('Check auth error:', error);
          return currentUser ? true : false;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
      }),
    }
  )
);

// 监听 Supabase 认证状态变化
let logoutPromise: Promise<void> | null = null;
let isSigningOut = false; // 标志位：防止 onAuthStateChange 中的 SIGNED_OUT 触发无限循环

onAuthStateChange(async (event, session) => {
  // 如果正在处理登出，等待完成后再处理，避免竞态条件
  if (logoutPromise) {
    await logoutPromise;
  }

  // 如果是本地触发的登出操作，不重复处理
  if (isSigningOut) {
    return;
  }

  if (event === 'SIGNED_OUT') {
    // 创建登出 promise，确保在 signOut 完成前阻止其他操作
    // 注意：这里只清除本地状态，不再调用 logout() 避免无限循环
    logoutPromise = (async () => {
      // 直接清除本地状态，不调用 signOut() 避免循环
      useStore.getState().cleanup();
      useAuthStore.setState({ isAuthenticated: false, currentUser: null });
    })();
    await logoutPromise;
    logoutPromise = null;
  }
  // 注意：SIGNED_IN 事件不再需要额外处理
  // 因为登录流程已经在 login() 方法中正确设置了 isAuthenticated 和 currentUser
});
