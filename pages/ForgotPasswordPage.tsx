import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/authStore';
import { VALIDATION_RULES } from '../types/auth';

export const ForgotPasswordPage: React.FC = () => {
  const { sendVerificationCode } = useAuthStore();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendResetEmail = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }
    if (!VALIDATION_RULES.email.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await sendVerificationCode(email);

      if (result.success) {
        setSuccess(true);
        setCountdown(60);
      } else {
        setError(result.error || '发送失败，请稍后重试');
      }
    } catch (err: any) {
      setError(err.message || '发送失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="找回密码" subtitle="通过邮箱重置密码">
      {!success ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            输入您的注册邮箱，我们将发送密码重置链接到您的邮箱。
          </p>

          <Input
            icon={<Mail size={20} />}
            type="email"
            placeholder="注册邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button onClick={handleSendResetEmail} fullWidth disabled={isLoading || countdown > 0}>
            {isLoading ? '发送中...' : countdown > 0 ? `${countdown}秒后可重新发送` : '发送重置链接'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-800">邮件已发送</h3>
          <p className="text-sm text-slate-600">
            我们已向 <strong>{email}</strong> 发送了密码重置邮件，请查收并点击链接重置密码。
          </p>
          <p className="text-xs text-slate-500 mt-4">
            如果没有收到邮件，请检查垃圾邮件或稍后重试。
          </p>
          <Button onClick={() => { setSuccess(false); setCountdown(0); }} variant="secondary" fullWidth className="mt-4">
            重新输入邮箱
          </Button>
        </div>
      )}

      <div className="mt-6 text-center text-sm">
        <Link to="/login" className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
          <ArrowLeft size={16} /> 返回登录
        </Link>
      </div>
    </AuthLayout>
  );
};
