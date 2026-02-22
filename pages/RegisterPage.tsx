import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { VALIDATION_RULES } from '../types/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // 用户名验证
    if (username.length < VALIDATION_RULES.username.minLength || username.length > VALIDATION_RULES.username.maxLength) {
      newErrors.username = `用户名需要 ${VALIDATION_RULES.username.minLength}-${VALIDATION_RULES.username.maxLength} 个字符`;
    } else if (!VALIDATION_RULES.username.pattern.test(username)) {
      newErrors.username = '用户名只能包含字母、数字、中文和下划线';
    }

    // 邮箱验证
    if (!VALIDATION_RULES.email.test(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 密码验证
    if (password.length < VALIDATION_RULES.password.minLength || password.length > VALIDATION_RULES.password.maxLength) {
      newErrors.password = `密码需要 ${VALIDATION_RULES.password.minLength}-${VALIDATION_RULES.password.maxLength} 位`;
    }

    // 确认密码
    if (password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    // 用户协议
    if (!agreedToTerms) {
      newErrors.terms = '请先阅读并同意用户协议和隐私政策';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    const result = await register(username, email, password);
    setIsLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setErrors({ form: result.error || '注册失败' });
    }
  };

  return (
    <AuthLayout title="创建账户" subtitle="开始使用 LiteLedger">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          icon={<User size={20} />}
          type="text"
          placeholder="用户名 (3-15字符)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          autoComplete="username"
        />

        <Input
          icon={<Mail size={20} />}
          type="email"
          placeholder="邮箱地址"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          icon={<Lock size={20} />}
          type="password"
          placeholder={`密码 (${VALIDATION_RULES.password.minLength}-${VALIDATION_RULES.password.maxLength}位)`}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />

        <Input
          icon={<Lock size={20} />}
          type="password"
          placeholder="确认密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {errors.form && (
          <p className="text-red-500 text-sm text-center">{errors.form}</p>
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
            <Link to="/user-agreement" state={{ from: '/register' }} className="text-blue-600 hover:underline mx-1">《用户协议》</Link>
            和
            <Link to="/privacy-policy" state={{ from: '/register' }} className="text-blue-600 hover:underline mx-1">《隐私政策》</Link>
          </span>
        </label>
        {errors.terms && (
          <p className="text-red-500 text-xs">{errors.terms}</p>
        )}

        <Button type="submit" fullWidth disabled={isLoading}>
          {isLoading ? '注册中...' : '立即注册'}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-slate-500">已有账户？</span>
        <Link to="/login" className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center gap-1 ml-1">
          <ArrowLeft size={16} /> 登录
        </Link>
      </div>
    </AuthLayout>
  );
};
