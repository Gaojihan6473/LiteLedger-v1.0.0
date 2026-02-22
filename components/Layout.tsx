
import React from 'react';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: 'entry' | 'transactions' | 'stats' | 'savings' | 'calendar' | 'settings';
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab }) => {
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
        <div className="h-full min-h-screen p-4 pb-28 md:p-8 md:pb-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {activeTab && (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
          <BottomNav activeTab={activeTab} variant="mobile" />
        </div>
      )}
    </div>
  );
};
