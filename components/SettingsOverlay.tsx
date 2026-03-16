import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import { ConfirmDialog } from './ConfirmDialog';
import { useStore } from '../store';
import { useAuthStore } from '../store/authStore';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ isOpen, onClose }) => {
  const { clearAllData } = useStore();
  const { logout, currentUser } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearData = async () => {
    await clearAllData();
    setShowClearConfirm(false);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* 设置面板 - 进入时从右向左滑入，退出时从左向右滑出 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col"
          >
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
              title="清除数据"
              message="确定要清除所有数据吗？此操作不可恢复。"
              confirmText="清除"
              cancelText="取消"
              showRemember={false}
              onConfirm={handleClearData}
              onCancel={() => setShowClearConfirm(false)}
            />

            {/* 设置内容 */}
            <div className="flex-1 overflow-y-auto">
              {/* 头部 */}
              <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Icon name="ChevronLeft" size={24} className="text-slate-600" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">设置</h1>
              </div>

              {/* 账户信息 */}
              {currentUser && (
                <div className="mx-4 mt-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">账户</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between py-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-slate-900">{currentUser.username}</p>
                        <p className="text-sm text-slate-500 truncate">{currentUser.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 功能设置 */}
              <div className="mx-4 mt-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">功能</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-slate-700">退出登录</span>
                    <Icon name="LogOut" size={18} className="text-slate-400" />
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span className="text-red-600">清除所有数据</span>
                    <Icon name="Trash2" size={18} className="text-red-400" />
                  </button>
                </div>
              </div>

              {/* 关于 */}
              <div className="mx-4 mt-4 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-4">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">关于</span>
                </div>
                <div className="p-4 text-center">
                  <p className="text-sm text-slate-500">LiteLedger 轻账</p>
                  <p className="text-xs text-slate-400 mt-1">版本 1.0.0</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
