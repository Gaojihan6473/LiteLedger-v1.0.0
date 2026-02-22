import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailOrUsername.trim() || !password) {
      setError('请输入用户名/邮箱和密码');
      return;
    }

    if (!agreedToTerms) {
      setError('请先阅读并同意用户协议');
      return;
    }

    setIsLoading(true);
    const result = await login(emailOrUsername, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || '登录失败');
    }
  };

  return (
    <AuthLayout title="欢迎回来" subtitle="登录您的账户">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          icon={<Mail size={20} />}
          type="email"
          placeholder="邮箱地址"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
          autoComplete="email"
        />

        <Input
          icon={<Lock size={20} />}
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}

        {/* 用户协议 */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs text-slate-500">
            我已阅读并同意
            <Link to="/user-agreement" state={{ from: '/login' }} className="text-blue-600 hover:underline mx-1">《用户协议》</Link>
            和
            <Link to="/privacy-policy" state={{ from: '/login' }} className="text-blue-600 hover:underline mx-1">《隐私政策》</Link>
          </span>
        </label>

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? '登录中...' : '登录'}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link to="/forgot-password" className="text-slate-500 hover:text-slate-700">
          忘记密码？
        </Link>
        <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
          注册账户 <ArrowRight size={16} />
        </Link>
      </div>
    </AuthLayout>
  );
};
