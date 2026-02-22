import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useStore } from '../store';
import { useAuthStore } from '../store/authStore';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { clearAllData } = useStore();
  const { logout, currentUser } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  const handleLogoutConfirm = async () => {
    // 先关闭弹窗，让UI立即响应
    setShowLogoutConfirm(false);

    // 异步执行logout，不阻塞UI
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }

    // 跳转到登录页
    navigate('/login');
  };

  return (
    <Layout activeTab="settings">
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="退出登录"
        message="确定要退出当前账户吗？"
        confirmText="退出"
        cancelText="取消"
        showRemember={false}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="清空数据"
        message="此操作将永久删除所有记账记录和设置。操作无法撤销。"
        confirmText="确认清空"
        cancelText="取消"
        showRemember={false}
        onConfirm={handleClearData}
        onCancel={() => setShowClearConfirm(false)}
      />

      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">设置</h1>

        {/* 账户信息 - macOS 风格分组 */}
        {currentUser && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">账户</span>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-medium text-slate-900">{currentUser.username}</p>
                  <p className="text-sm text-slate-500 truncate">{currentUser.email}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="shrink-0 ml-4"
                >
                  退出登录
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 数据管理 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">数据</span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-base font-medium text-slate-900">清空所有数据</p>
                <p className="text-sm text-slate-500 mt-0.5">删除所有记账记录和账户设置，无法恢复</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="shrink-0"
              >
                清空
              </Button>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">关于</span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-slate-900">LiteLedger</p>
                <p className="text-sm text-slate-500 mt-0.5">轻账 v1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
