import React, { useState } from 'react';
import { Terminal, Download, Plus, LogIn, LogOut, Menu, X, GitFork, Play, Globe, Sun, Moon } from 'lucide-react';
import { UserSession } from '../types';

export type ActiveTab = 'playground' | 'github' | 'builder' | 'vercel' | 'docs';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewApiModal: () => void;
  onDownloadVercelZip: () => void;
  endpointsCount: number;
  session: UserSession;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewApiModal,
  onDownloadVercelZip,
  endpointsCount,
  session,
  onOpenLoginModal,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center justify-between gap-6 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <div 
          onClick={() => handleNavClick('playground')}
          className="flex items-center gap-2.5 cursor-pointer select-none whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:border-indigo-400 transition-colors shadow-sm">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
              GitAPI Studio
            </span>
            {session.isAdmin ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-950 border border-emerald-800 text-emerald-300 rounded font-mono">
                ADMIN
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-normal hidden lg:inline">
                · {endpointsCount} APIs Sẵn Sàng
              </span>
            )}
          </div>
        </div>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => handleNavClick('playground')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'playground'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Playground (Get API)
          </button>

          <button
            onClick={() => handleNavClick('docs')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Danh Mục & Sơ Đồ</span>
            <span className="text-[11px] font-mono text-slate-500">
              ({endpointsCount})
            </span>
          </button>

          <button
            onClick={() => handleNavClick('github')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'github'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đọc Repo GitHub
          </button>

          <button
            onClick={() => {
              if (!session.isAdmin) {
                onOpenLoginModal();
              } else {
                handleNavClick('builder');
              }
            }}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'builder'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{session.isAdmin ? 'Quản Lý & Sửa API' : 'Chỉnh Sửa API'}</span>
            {!session.isAdmin && (
              <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-900/50 px-1 py-0.2 rounded font-mono">
                Khóa
              </span>
            )}
          </button>

          <button
            onClick={() => handleNavClick('vercel')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'vercel'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Xuất Vercel
          </button>
        </nav>

        {/* Zone 3: Actions, Auth Control & Theme Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Dark / Light Mode Switcher */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-900 border border-slate-800 transition-colors shrink-0"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng (Light Mode)' : 'Chuyển sang giao diện Tối (Dark Mode)'}
            aria-label="Chuyển đổi giao diện sáng/tối"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {session.isAdmin ? (
            <>
              <button
                onClick={onDownloadVercelZip}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                title="Tải toàn bộ source code Vercel (.zip)"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Tải Zip</span>
              </button>

              <button
                onClick={onOpenNewApiModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tạo API</span>
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                title="Đăng xuất Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-400" />
              <span>Đăng Nhập Admin</span>
            </button>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-6 py-4 border-t border-slate-800 bg-slate-950/95 space-y-2">
          <button
            onClick={() => handleNavClick('playground')}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg ${activeTab === 'playground' ? 'bg-indigo-950/80 text-indigo-300' : 'text-slate-400'}`}
          >
            Playground (Get API)
          </button>
          <button
            onClick={() => handleNavClick('docs')}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg ${activeTab === 'docs' ? 'bg-indigo-950/80 text-indigo-300' : 'text-slate-400'}`}
          >
            Danh Mục & Sơ Đồ API ({endpointsCount})
          </button>
          <button
            onClick={() => handleNavClick('github')}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg ${activeTab === 'github' ? 'bg-indigo-950/80 text-indigo-300' : 'text-slate-400'}`}
          >
            Đọc Repo GitHub
          </button>
          <button
            onClick={() => {
              if (!session.isAdmin) {
                onOpenLoginModal();
                setMobileMenuOpen(false);
              } else {
                handleNavClick('builder');
              }
            }}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg ${activeTab === 'builder' ? 'bg-indigo-950/80 text-indigo-300' : 'text-slate-400'}`}
          >
            {session.isAdmin ? 'Quản Lý & Sửa API' : 'Chỉnh Sửa API (Cần Admin)'}
          </button>
          <button
            onClick={() => handleNavClick('vercel')}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg ${activeTab === 'vercel' ? 'bg-indigo-950/80 text-indigo-300' : 'text-slate-400'}`}
          >
            Xuất Cho Vercel
          </button>

          {/* Theme switcher inside mobile drawer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between px-3 py-2">
            <span className="text-xs text-slate-400">Giao diện:</span>
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-200"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chế độ Sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Chế độ Tối</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
