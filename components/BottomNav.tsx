
import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

interface BottomNavProps {
  activeTab: 'entry' | 'transactions' | 'stats' | 'savings' | 'calendar' | 'settings';
  variant?: 'mobile' | 'desktop';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, variant = 'mobile' }) => {
  const navItems = [
    { id: 'entry', label: '记账', icon: 'Plus', path: '/' },
    { id: 'transactions', label: '明细', icon: 'List', path: '/transactions' },
    { id: 'stats', label: '统计', icon: 'PieChart', path: '/stats' },
    { id: 'calendar', label: '日历', icon: 'Calendar', path: '/calendar' },
    { id: 'savings', label: '存款', icon: 'Wallet', path: '/savings' },
    { id: 'settings', label: '设置', icon: 'Settings', path: '/settings' },
  ];

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

  // Mobile Floating Bar
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl h-16 flex items-center justify-around px-2">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <Link 
            key={item.id} 
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 h-full rounded-xl transition-all duration-200 cursor-pointer ${
              isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Icon 
              name={item.icon} 
              size={24} 
              className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            {isActive && <div className="mt-1 w-1 h-1 rounded-full bg-blue-600" />}
          </Link>
        );
      })}
    </div>
  );
};
