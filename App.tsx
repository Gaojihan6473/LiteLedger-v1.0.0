
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EntryPage } from './pages/EntryPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { StatsPage } from './pages/StatsPage';
import { SavingsPage } from './pages/SavingsPage';
import { CalendarPage } from './pages/CalendarPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UserAgreementPage } from './pages/UserAgreementPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { useAuthStore } from './store/authStore';
import { useStore } from './store';

// 路由守卫组件：未登录用户跳转登录页
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 公共路由：已登录用户访问自动跳转首页
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { initData } = useStore();

  // 检查认证状态并初始化数据
  useEffect(() => {
    const init = async () => {
      await checkAuth();
    };
    init();
  }, []);

  // 当认证状态改变时，从 Supabase 加载数据
  useEffect(() => {
    if (isAuthenticated) {
      initData();
    }
  }, [isAuthenticated]);

  return (
    <HashRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/user-agreement" element={<UserAgreementPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

        {/* 受保护路由 */}
        <Route path="/" element={<ProtectedRoute><EntryPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
        <Route path="/savings" element={<ProtectedRoute><SavingsPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
