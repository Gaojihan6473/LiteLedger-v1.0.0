
import React from 'react';
import { BottomNav } from './BottomNav';
import { Icon } from './Icon';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: 'entry' | 'transactions' | 'stats' | 'savings' | 'calendar' | 'settings';
  title?: string;
  showSettingsButton?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, title, showSettingsButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';
  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col md:flex-row text-slate-900">
      {/* Desktop Sidebar */}
      {activeTab && (
        <aside className="hidden md:flex w-56 flex-col border-r border-slate-200 bg-white fixed h-full left-0 top-0 z-20">
          <div className="p-6 flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">LiteLedger</span>
          </div>
          <div className="flex-1 px-4">
             <BottomNav activeTab={activeTab} variant="desktop" />
          </div>
          <div className="p-6 border-t border-slate-100">
            <div className="text-xs text-slate-400">© 2024 LiteLedger</div>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 relative w-full ${activeTab ? 'md:ml-56' : ''}`}>
        {/* Mobile Top Header - 固定顶部标题栏 */}
        {title && activeTab && (
          <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-gradient-to-b from-white via-slate-50/90 to-slate-100/40 border-b border-slate-200/50 shadow-[0_4px_20px_-3px_rgba(0,0,0,0.06)] flex items-center justify-center px-4">
            {/* 左侧按钮：设置页显示返回按钮，其他页面显示设置按钮 */}
            {isSettingsPage ? (
              <button
                onClick={() => navigate(-1)}
                className="absolute left-2 p-2 -ml-2 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer"
              >
                <Icon name="ChevronLeft" size={20} className="text-slate-600" />
              </button>
            ) : showSettingsButton ? (
              <button
                onClick={() => navigate('/settings')}
                className="absolute left-2 p-2 -ml-2 rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer"
              >
                <Icon name="Settings" size={20} className="text-slate-600" />
              </button>
            ) : null}
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
        )}
        <div className={`h-full min-h-screen ${title && activeTab ? 'pt-14' : ''} px-4 pt-3 pb-20 md:p-8 md:pb-8 max-w-[1600px] mx-auto`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav - 固定底部 */}
      {activeTab && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav activeTab={activeTab} variant="mobile" />
        </div>
      )}
    </div>
  );
};
