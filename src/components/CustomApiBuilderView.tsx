import React, { useState } from 'react';
import {
  Plus,
  Play,
  Trash2,
  Edit2,
  Copy,
  Check,
  Zap,
  Globe,
  Sliders,
  Sparkles,
  FileCode,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { CustomEndpoint, HttpMethod, SourceType } from '../types';
import { apiService } from '../services/apiService';

interface CustomApiBuilderViewProps {
  endpoints: CustomEndpoint[];
  onRefreshEndpoints: () => Promise<void>;
  onTestInPlayground: (url: string, method?: HttpMethod) => void;
  editingEndpoint?: Partial<CustomEndpoint> | null;
  onClearEditing?: () => void;
  isAdmin: boolean;
  onOpenLoginModal: () => void;
}

export const CustomApiBuilderView: React.FC<CustomApiBuilderViewProps> = ({
  endpoints,
  onRefreshEndpoints,
  onTestInPlayground,
  editingEndpoint,
  onClearEditing,
  isAdmin,
  onOpenLoginModal,
}) => {
  const [isFormOpen, setIsFormOpen] = useState<boolean>(!!editingEndpoint);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [id, setId] = useState<string>(editingEndpoint?.id || '');
  const [name, setName] = useState<string>(editingEndpoint?.name || '');
  const [path, setPath] = useState<string>(editingEndpoint?.path || '/api/custom/v1/my-api');
  const [method, setMethod] = useState<HttpMethod>(editingEndpoint?.method || 'GET');
  const [sourceType, setSourceType] = useState<SourceType>(editingEndpoint?.sourceType || 'static_json');
  const [githubRepo, setGithubRepo] = useState<string>(editingEndpoint?.githubRepo || '');
  const [githubFilePath, setGithubFilePath] = useState<string>(editingEndpoint?.githubFilePath || '');
  const [githubBranch, setGithubBranch] = useState<string>(editingEndpoint?.githubBranch || 'main');
  const [statusCode, setStatusCode] = useState<number>(editingEndpoint?.statusCode || 200);
  const [latencyMs, setLatencyMs] = useState<number>(editingEndpoint?.latencyMs || 80);
  const [description, setDescription] = useState<string>(editingEndpoint?.description || '');
  const [responseBody, setResponseBody] = useState<string>(
    editingEndpoint?.responseBody ||
      JSON.stringify(
        {
          status: 'success',
          message: 'Xin chào từ API riêng của bạn!',
          data: [
            { id: 1, title: 'Tính năng A', active: true },
            { id: 2, title: 'Tính năng B', active: false },
          ],
        },
        null,
        2
      )
  );

  // Update form if editingEndpoint prop changes
  React.useEffect(() => {
    if (editingEndpoint) {
      setId(editingEndpoint.id || '');
      setName(editingEndpoint.name || '');
      setPath(editingEndpoint.path || '/api/custom/v1/my-api');
      setMethod(editingEndpoint.method || 'GET');
      setSourceType(editingEndpoint.sourceType || 'static_json');
      setGithubRepo(editingEndpoint.githubRepo || '');
      setGithubFilePath(editingEndpoint.githubFilePath || '');
      setGithubBranch(editingEndpoint.githubBranch || 'main');
      setStatusCode(editingEndpoint.statusCode || 200);
      setLatencyMs(editingEndpoint.latencyMs !== undefined ? editingEndpoint.latencyMs : 80);
      setDescription(editingEndpoint.description || '');
      setResponseBody(
        editingEndpoint.responseBody ||
          JSON.stringify({ status: 'success', data: [] }, null, 2)
      );
      setIsFormOpen(true);
    }
  }, [editingEndpoint]);

  const handleOpenNew = () => {
    setId('');
    setName('API Tùy Chỉnh Mới');
    setPath(`/api/custom/v1/dataset-${Date.now().toString(36).slice(-4)}`);
    setMethod('GET');
    setSourceType('static_json');
    setGithubRepo('');
    setGithubFilePath('');
    setGithubBranch('main');
    setStatusCode(200);
    setLatencyMs(100);
    setDescription('Mô tả mục đích sử dụng cho API này');
    setResponseBody(
      JSON.stringify(
        {
          success: true,
          timestamp: new Date().toISOString(),
          items: [
            { id: 101, name: 'Sản phẩm mẫu 1', price: 299000 },
            { id: 102, name: 'Sản phẩm mẫu 2', price: 450000 },
          ],
        },
        null,
        2
      )
    );
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEdit = (ep: CustomEndpoint) => {
    setId(ep.id);
    setName(ep.name);
    setPath(ep.path);
    setMethod(ep.method);
    setSourceType(ep.sourceType);
    setGithubRepo(ep.githubRepo || '');
    setGithubFilePath(ep.githubFilePath || '');
    setGithubBranch(ep.githubBranch || 'main');
    setStatusCode(ep.statusCode);
    setLatencyMs(ep.latencyMs);
    setDescription(ep.description || '');
    setResponseBody(ep.responseBody);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (epId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa endpoint này không?')) return;
    try {
      await apiService.deleteEndpoint(epId);
      await onRefreshEndpoints();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate JSON if static_json
    if (sourceType === 'static_json') {
      try {
        JSON.parse(responseBody);
      } catch (err) {
        setFormError('Dữ liệu JSON phản hồi không hợp lệ. Vui lòng kiểm tra lại dấu ngoặc và cú pháp.');
        return;
      }
    }

    setSaveLoading(true);
    try {
      await apiService.saveEndpoint({
        id: id || undefined,
        name,
        path,
        method,
        sourceType,
        githubRepo: sourceType === 'github_raw' ? githubRepo : undefined,
        githubFilePath: sourceType === 'github_raw' ? githubFilePath : undefined,
        githubBranch: sourceType === 'github_raw' ? githubBranch : undefined,
        statusCode,
        latencyMs,
        headers: { 'Content-Type': 'application/json' },
        responseBody,
        description,
      });

      await onRefreshEndpoints();
      setIsFormOpen(false);
      if (onClearEditing) onClearEditing();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleApplyTemplate = (type: 'products' | 'users' | 'rates' | 'crypto') => {
    switch (type) {
      case 'products':
        setResponseBody(
          JSON.stringify(
            {
              catalog: 'Vietnam Electronic Goods',
              updated: new Date().toISOString(),
              products: [
                { id: 'p1', name: 'Bàn phím cơ không dây', price: 1450000, stock: 45, rating: 4.8 },
                { id: 'p2', name: 'Chuột công thái học Master 3S', price: 2190000, stock: 18, rating: 4.9 },
                { id: 'p3', name: 'Tai nghe chống ồn chủ động', price: 3200000, stock: 22, rating: 4.7 }
              ]
            },
            null,
            2
          )
        );
        break;
      case 'users':
        setResponseBody(
          JSON.stringify(
            {
              total: 3,
              users: [
                { id: 'u1', name: 'Vũ Quốc Toàn', role: 'Fullstack Dev', email: 'toan@example.com' },
                { id: 'u2', name: 'Lê Minh Khang', role: 'DevOps Engineer', email: 'khang@example.com' },
                { id: 'u3', name: 'Đoàn Thu Trang', role: 'Product Lead', email: 'trang@example.com' }
              ]
            },
            null,
            2
          )
        );
        break;
      case 'crypto':
        setResponseBody(
          JSON.stringify(
            {
              base: 'USD',
              timestamp: new Date().toISOString(),
              tickers: {
                BTC: 98450.25,
                ETH: 3420.80,
                SOL: 224.50,
                BNB: 680.10
              }
            },
            null,
            2
          )
        );
        break;
      case 'rates':
        setResponseBody(
          JSON.stringify(
            {
              bank: 'Vietcombank Reference Rates',
              currency: 'VND',
              rates: {
                USD: 25420,
                EUR: 27550,
                JPY: 168.4,
                GBP: 32410
              }
            },
            null,
            2
          )
        );
        break;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{isAdmin ? 'Quản Lý & Chỉnh Sửa API (Admin)' : 'Kho API Dành Cho Người Dùng'}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin
              ? 'Thiết lập endpoint REST tùy chỉnh, liên kết dữ liệu từ GitHub raw file hoặc mock data cho Vercel'
              : 'Duyệt danh sách các API đang hoạt động để lấy dữ liệu (GET) hoặc đăng nhập Admin để tùy chỉnh'}
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo API Mới</span>
          </button>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Đăng Nhập Admin Để Tạo/Sửa</span>
          </button>
        )}
      </div>

      {/* Guest Mode Notice */}
      {!isAdmin && (
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-300">
            <span className="font-semibold text-white">Chế độ Người dùng (Get API): </span>
            Bạn có thể thử nghiệm, sao chép URL và gọi dữ liệu mọi API dưới đây. Để tạo endpoint mới hoặc chỉnh sửa/xóa, vui lòng đăng nhập tài khoản Admin.
          </div>
          <button
            onClick={onOpenLoginModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors"
          >
            Đăng nhập Admin
          </button>
        </div>
      )}

      {/* Endpoint Creation & Edit Modal / Drawer */}
      {isFormOpen && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-5 shadow-2xl relative">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>{id ? 'Chỉnh Sửa Endpoint API' : 'Tạo Endpoint API Mới'}</span>
            </h3>
            <button
              onClick={() => {
                setIsFormOpen(false);
                if (onClearEditing) onClearEditing();
              }}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="mt-3 p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* API Name */}
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tên API (Gợi nhớ):
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Ví dụ: Danh Mục Phim MongoDB"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Method */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Method:
                </label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value as HttpMethod)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              {/* Path */}
              <div className="md:col-span-5">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Đường dẫn Endpoint (Path):
                </label>
                <input
                  type="text"
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  required
                  placeholder="/api/custom/v1/..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Source Type Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nguồn Dữ Liệu Cung Cấp Cho API:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSourceType('static_json')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    sourceType === 'static_json'
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-100">1. Dữ Liệu JSON Tự Nhập</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tùy biến cấu trúc JSON trực tiếp trong trình soạn thảo
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('github_raw')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    sourceType === 'github_raw'
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-100">2. Nguồn Trực Tiếp Từ GitHub</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Đọc file từ raw.githubusercontent.com theo thời gian thực
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSourceType('mock_generator')}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    sourceType === 'mock_generator'
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-xs text-slate-100">3. Bộ Sinh Dữ Liệu Mẫu</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Tự sinh ngẫu nhiên danh sách users, products, telemetry
                  </div>
                </button>
              </div>
            </div>

            {/* GitHub Specific Fields */}
            {sourceType === 'github_raw' && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-indigo-300">
                  Thông tin kết nối GitHub Repository:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Repo (owner/repo):</label>
                    <input
                      type="text"
                      value={githubRepo}
                      onChange={e => setGithubRepo(e.target.value)}
                      placeholder="ozlerhakan/mongodb-json-files"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Đường dẫn file (path):</label>
                    <input
                      type="text"
                      value={githubFilePath}
                      onChange={e => setGithubFilePath(e.target.value)}
                      placeholder="datasets/movies.json"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Branch:</label>
                    <input
                      type="text"
                      value={githubBranch}
                      onChange={e => setGithubBranch(e.target.value)}
                      placeholder="main"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Response Simulation Controls: Status Code & Latency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mã HTTP Status Code Trả Về:
                </label>
                <select
                  value={statusCode}
                  onChange={e => setStatusCode(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono text-slate-200"
                >
                  <option value={200}>200 OK (Thành công)</option>
                  <option value={201}>201 Created (Đã tạo mới)</option>
                  <option value={400}>400 Bad Request (Lỗi yêu cầu)</option>
                  <option value={401}>401 Unauthorized (Chưa đăng nhập)</option>
                  <option value={404}>404 Not Found (Không tìm thấy)</option>
                  <option value={500}>500 Internal Server Error</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1">
                  <span>Mô phỏng độ trễ (Latency):</span>
                  <span className="font-mono text-indigo-300 tabular-nums">{latencyMs} ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="50"
                  value={latencyMs}
                  onChange={e => setLatencyMs(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            {/* JSON Editor & Templates */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Dữ Liệu Phản Hồi JSON (Response Body):
                </label>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Mẫu có sẵn:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('products')}
                    className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    Sản phẩm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('users')}
                    className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    Người dùng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('crypto')}
                    className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    Crypto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('rates')}
                    className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                  >
                    Tỷ giá
                  </button>
                </div>
              </div>

              <textarea
                value={responseBody}
                onChange={e => setResponseBody(e.target.value)}
                rows={9}
                required
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Ghi chú / Mô tả:
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ví dụ: API cung cấp danh mục sản phẩm cho website thương mại điện tử"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit & Cancel */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  if (onClearEditing) onClearEditing();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition-colors"
              >
                Hủy Bỏ
              </button>

              <button
                type="submit"
                disabled={saveLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saveLoading ? 'Đang lưu...' : 'Lưu Endpoint API'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Endpoints List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Danh Sách Endpoint Hiện Tại ({endpoints.length})
            </span>
          </div>

          <div className="text-xs text-slate-500">
            Tất cả endpoint đều hỗ trợ bộ lọc truy vấn: <code className="text-slate-400">?limit=</code>, <code className="text-slate-400">?search=</code>, <code className="text-slate-400">?page=</code>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {endpoints.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Chưa có endpoint nào. Hãy nhấn "Tạo API Mới" ở trên để bắt đầu!
            </div>
          ) : (
            endpoints.map(ep => {
              const isCopied = copiedId === ep.id;
              return (
                <div
                  key={ep.id}
                  className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Endpoint identity */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Method Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          ep.method === 'GET'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                            : ep.method === 'POST'
                            ? 'bg-sky-950/80 text-sky-300 border border-sky-800/80'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                        }`}
                      >
                        {ep.method}
                      </span>

                      {/* Path */}
                      <span className="font-mono text-sm font-semibold text-white truncate">
                        {ep.path}
                      </span>

                      {/* Status and Latency metadata */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                        <span>·</span>
                        <span className="text-emerald-400 tabular-nums">{ep.statusCode} OK</span>
                        <span>·</span>
                        <span className="tabular-nums">{ep.latencyMs}ms</span>
                        <span>·</span>
                        <span className="text-slate-500 capitalize">
                          {ep.sourceType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      <span className="font-medium text-slate-300">{ep.name}</span>
                      {ep.description && ` — ${ep.description}`}
                    </div>

                    {ep.sourceType === 'github_raw' && ep.githubRepo && (
                      <div className="text-[11px] font-mono text-indigo-400 flex items-center gap-1">
                        <span>GitHub Nguồn: {ep.githubRepo}/{ep.githubFilePath} ({ep.githubBranch || 'main'})</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Copy URL */}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + ep.path);
                        setCopiedId(ep.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs flex items-center gap-1 transition-colors"
                      title="Sao chép URL Endpoint đầy đủ"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isCopied ? 'Đã chép' : 'Sao chép URL'}</span>
                    </button>

                    {/* Test in Playground */}
                    <button
                      onClick={() => onTestInPlayground(ep.path, ep.method)}
                      className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Thử Nghiệm</span>
                    </button>

                    {/* Edit & Delete (Admin Only) */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(ep)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="Chỉnh sửa (Admin)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(ep.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Xóa (Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
