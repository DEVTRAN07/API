import React, { useState, useEffect } from 'react';
import { TopNav, ActiveTab } from './components/TopNav';
import { PlaygroundView } from './components/PlaygroundView';
import { GitHubToApiView } from './components/GitHubToApiView';
import { CustomApiBuilderView } from './components/CustomApiBuilderView';
import { VercelDeployView } from './components/VercelDeployView';
import { ApiDocsView } from './components/ApiDocsView';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { CustomEndpoint, HttpMethod, UserSession } from './types';
import { apiService } from './services/apiService';
import { downloadVercelZip } from './services/vercelExporter';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('playground');
  const [endpoints, setEndpoints] = useState<CustomEndpoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Authentication state
  const [session, setSession] = useState<UserSession>({
    isAdmin: false,
    username: 'Khách',
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Dark / Light Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('gitapi_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('gitapi_theme', theme);
    } catch {}
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      showToast(`Đã chuyển sang giao diện ${next === 'dark' ? 'Tối (Dark Mode)' : 'Sáng (Light Mode)'}`, 'info');
      return next;
    });
  };

  // Cross-tab interaction states
  const [playgroundUrl, setPlaygroundUrl] = useState<string>('/api/custom/v1/public-apis');
  const [playgroundMethod, setPlaygroundMethod] = useState<HttpMethod>('GET');
  const [editingEndpoint, setEditingEndpoint] = useState<Partial<CustomEndpoint> | null>(null);

  // Check stored auth session and fetch all endpoints on mount
  useEffect(() => {
    apiService.checkAuth().then(s => {
      setSession(s);
      if (s.isAdmin) {
        showToast('Chào mừng Quản trị viên (Admin) trở lại!', 'info');
      }
    });
    refreshEndpoints();
  }, []);

  const refreshEndpoints = async () => {
    try {
      const data = await apiService.getEndpoints();
      setEndpoints(data);
    } catch (err) {
      console.error('Lỗi tải danh sách endpoints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    setActiveTab('builder');
    showToast('Đăng nhập Quản trị viên thành công! Toàn bộ quyền tạo và sửa API đã được mở khóa.', 'success');
  };

  const handleLogout = async () => {
    await apiService.logout();
    setSession({ isAdmin: false, username: 'Khách' });
    setActiveTab('playground');
    showToast('Đã đăng xuất khỏi tài khoản Quản trị viên.', 'info');
  };

  // Handler when user selects a file from GitHub to convert to API
  const handleConvertToCustomApi = async (data: {
    name: string;
    path: string;
    repo: string;
    filePath: string;
    branch: string;
    sampleBody: string;
    isJson: boolean;
  }) => {
    if (!session.isAdmin) {
      setIsLoginModalOpen(true);
      return;
    }

    try {
      const newEp = await apiService.saveEndpoint({
        name: data.name,
        path: data.path,
        method: 'GET',
        sourceType: 'github_raw',
        githubRepo: data.repo,
        githubFilePath: data.filePath,
        githubBranch: data.branch,
        statusCode: 200,
        latencyMs: 120,
        headers: { 'Content-Type': 'application/json' },
        responseBody: data.sampleBody,
        description: `Tự động tạo từ GitHub: ${data.repo}/${data.filePath}`,
      });

      await refreshEndpoints();
      showToast(`Đã tạo thành công endpoint: ${newEp.path}`, 'success');

      setPlaygroundUrl(newEp.path);
      setPlaygroundMethod('GET');
      setActiveTab('playground');
    } catch (err: unknown) {
      setEditingEndpoint({
        name: data.name,
        path: data.path,
        method: 'GET',
        sourceType: 'github_raw',
        githubRepo: data.repo,
        githubFilePath: data.filePath,
        githubBranch: data.branch,
        statusCode: 200,
        latencyMs: 120,
        responseBody: data.sampleBody,
        description: `Tạo từ GitHub: ${data.repo}/${data.filePath}`,
      });
      setActiveTab('builder');
      showToast('Chuyển sang trình soạn thảo để hoàn tất cấu hình API.', 'info');
    }
  };

  const handleTestInPlayground = (url: string, method: HttpMethod = 'GET') => {
    setPlaygroundUrl(url);
    setPlaygroundMethod(method);
    setActiveTab('playground');
  };

  const handleOpenNewApiModal = () => {
    if (!session.isAdmin) {
      setIsLoginModalOpen(true);
      return;
    }
    setEditingEndpoint(null);
    setActiveTab('builder');
  };

  const handleDownloadZip = async () => {
    try {
      showToast('Đang nén toàn bộ mã nguồn Vercel...', 'info');
      await downloadVercelZip(endpoints);
      showToast('Đã tải thành công file dự án Vercel (.ZIP)!', 'success');
    } catch (err: unknown) {
      showToast('Lỗi tải file zip: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewApiModal={handleOpenNewApiModal}
        onDownloadVercelZip={handleDownloadZip}
        endpointsCount={endpoints.length}
        session={session}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'playground' && (
          <PlaygroundView
            endpoints={endpoints}
            initialUrl={playgroundUrl}
            initialMethod={playgroundMethod}
            isAdmin={session.isAdmin}
          />
        )}

        {activeTab === 'github' && (
          <GitHubToApiView
            onConvertToCustomApi={handleConvertToCustomApi}
            onTestInPlayground={handleTestInPlayground}
            isAdmin={session.isAdmin}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === 'builder' && (
          <CustomApiBuilderView
            endpoints={endpoints}
            onRefreshEndpoints={refreshEndpoints}
            onTestInPlayground={handleTestInPlayground}
            editingEndpoint={editingEndpoint}
            onClearEditing={() => setEditingEndpoint(null)}
            isAdmin={session.isAdmin}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === 'vercel' && (
          <VercelDeployView endpoints={endpoints} />
        )}

        {activeTab === 'docs' && (
          <ApiDocsView
            endpoints={endpoints}
            onTestInPlayground={handleTestInPlayground}
          />
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">GitAPI Studio</span>
            <span>·</span>
            <span>Nền tảng tạo REST API từ GitHub & xuất Vercel Serverless</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('playground')}
              className="hover:text-slate-200 transition-colors"
            >
              Playground (Get)
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className="hover:text-slate-200 transition-colors"
            >
              Danh Mục & Sơ Đồ API
            </button>
            <button
              onClick={() => setActiveTab('github')}
              className="hover:text-slate-200 transition-colors"
            >
              GitHub Explorer
            </button>
            <button
              onClick={() => {
                if (!session.isAdmin) {
                  setIsLoginModalOpen(true);
                } else {
                  setActiveTab('builder');
                }
              }}
              className="hover:text-slate-200 transition-colors"
            >
              {session.isAdmin ? 'Quản Lý API' : 'Đăng Nhập Admin'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
