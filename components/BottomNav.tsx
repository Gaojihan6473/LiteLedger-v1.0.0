
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

interface BottomNavProps {
  activeTab: 'entry' | 'transactions' | 'stats' | 'savings' | 'calendar' | 'settings';
  variant?: 'mobile' | 'desktop';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, variant = 'mobile' }) => {
  const desktopNavItems = [
    { id: 'entry', label: '记账', icon: 'Plus', path: '/' },
    { id: 'transactions', label: '明细', icon: 'List', path: '/transactions' },
    { id: 'stats', label: '统计', icon: 'PieChart', path: '/stats' },
    { id: 'calendar', label: '日历', icon: 'Calendar', path: '/calendar' },
    { id: 'savings', label: '存款', icon: 'Wallet', path: '/savings' },
    { id: 'settings', label: '设置', icon: 'Settings', path: '/settings' },
  ];

  const mobileNavItems = [
    { id: 'entry', label: '记账', icon: 'Plus', path: '/' },
    { id: 'transactions', label: '明细', icon: 'List', path: '/transactions' },
    { id: 'stats', label: '统计', icon: 'PieChart', path: '/stats' },
    { id: 'calendar', label: '日历', icon: 'Calendar', path: '/calendar' },
    { id: 'savings', label: '存款', icon: 'Wallet', path: '/savings' },
  ];

  const navItems = variant === 'desktop' ? desktopNavItems : mobileNavItems;

  if (variant === 'desktop') {
    return (
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Link 
              key={item.id} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon 
                name={item.icon} 
                size={20} 
                className={`transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                strokeWidth={2}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  // Mobile Fixed Bottom Nav - 记账在中间，均匀分布，带标签和质感
  return (
    <div className="bg-gradient-to-t from-slate-100 to-white border-t border-slate-200/60 shadow-[0_-4px_20px_-3px_rgba(0,0,0,0.08)] h-20 flex items-center justify-evenly px-2 pb-safe">
      {/* 明细 */}
      <Link
        to="/transactions"
        className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all duration-200 cursor-pointer ${
          activeTab === 'transactions'
            ? 'text-blue-600'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Icon name="List" size={22} strokeWidth={activeTab === 'transactions' ? 2.5 : 1.8} />
        <span className={`text-[9px] font-medium ${activeTab === 'transactions' ? 'text-blue-600' : 'text-slate-400'}`}>明细</span>
      </Link>

      {/* 统计 */}
      <Link
        to="/stats"
        className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all duration-200 cursor-pointer ${
          activeTab === 'stats'
            ? 'text-blue-600'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Icon name="PieChart" size={22} strokeWidth={activeTab === 'stats' ? 2.5 : 1.8} />
        <span className={`text-[9px] font-medium ${activeTab === 'stats' ? 'text-blue-600' : 'text-slate-400'}`}>统计</span>
      </Link>

      {/* 记账 - 中间突出按钮，无文字 */}
      <Link
        to="/"
        className="flex items-center justify-center -mt-1"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.4)] transition-transform duration-300 ${
          activeTab === 'entry'
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 scale-110'
            : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 scale-100'
        }`}
        >
          <Icon
            name="Plus"
            size={24}
            className="text-white drop-shadow-sm"
            strokeWidth={2.5}
          />
        </div>
      </Link>

      {/* 日历 */}
      <Link
        to="/calendar"
        className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all duration-200 cursor-pointer ${
          activeTab === 'calendar'
            ? 'text-blue-600'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Icon name="Calendar" size={22} strokeWidth={activeTab === 'calendar' ? 2.5 : 1.8} />
        <span className={`text-[9px] font-medium ${activeTab === 'calendar' ? 'text-blue-600' : 'text-slate-400'}`}>日历</span>
      </Link>

      {/* 存款 */}
      <Link
        to="/savings"
        className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-all duration-200 cursor-pointer ${
          activeTab === 'savings'
            ? 'text-blue-600'
            : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Icon name="Wallet" size={22} strokeWidth={activeTab === 'savings' ? 2.5 : 1.8} />
        <span className={`text-[9px] font-medium ${activeTab === 'savings' ? 'text-blue-600' : 'text-slate-400'}`}>存款</span>
      </Link>
    </div>
  );
};
