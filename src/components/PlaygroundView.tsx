import React, { useState, useEffect } from 'react';
import {
  Send,
  Copy,
  Check,
  Code2,
  Loader2,
  Sparkles,
  Search,
  Lock,
  Play,
  Download,
  History,
  Clock,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronRight,
  Database,
  ArrowRight
} from 'lucide-react';
import { CustomEndpoint, HttpMethod, ApiTestResponse } from '../types';
import { apiService } from '../services/apiService';
import {
  generateCurlSnippet,
  generateFetchSnippet,
  generatePythonSnippet,
  generateAxiosSnippet,
} from '../services/codeGenerators';
import { JsonSyntaxHighlighter } from './JsonSyntaxHighlighter';

interface PlaygroundViewProps {
  endpoints: CustomEndpoint[];
  initialUrl?: string;
  initialMethod?: HttpMethod;
  onSelectEndpoint?: (ep: CustomEndpoint) => void;
  isAdmin?: boolean;
}

interface RequestHistoryItem {
  id: string;
  url: string;
  method: HttpMethod;
  status: number;
  durationMs: number;
  timestamp: string;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  endpoints,
  initialUrl = '/api/custom/v1/public-apis',
  initialMethod = 'GET',
  isAdmin = false,
}) => {
  const [method, setMethod] = useState<HttpMethod>(initialMethod);
  const [url, setUrl] = useState<string>(initialUrl);

  // Search & Category Filter
  const [endpointSearchQuery, setEndpointSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'curated' | 'github' | 'mock'>('all');

  // Execution state
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ApiTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  // Response viewing tabs
  const [responseView, setResponseView] = useState<'json' | 'raw' | 'headers'>('json');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Code Snippet modal
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [snippetLang, setSnippetLang] = useState<'curl' | 'fetch' | 'python' | 'axios'>('curl');
  const [snippetCopied, setSnippetCopied] = useState<boolean>(false);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
    if (initialMethod) {
      setMethod(isAdmin ? initialMethod : 'GET');
    }
  }, [initialUrl, initialMethod, isAdmin]);

  // Filter endpoints by category & search query
  const filteredEndpoints = endpoints.filter(ep => {
    // Category match
    if (selectedCategory === 'github' && ep.sourceType !== 'github_raw') return false;
    if (selectedCategory === 'mock' && ep.sourceType !== 'mock_generator') return false;
    if (selectedCategory === 'curated' && ep.sourceType !== 'static_json') return false;

    // Search query match
    const q = endpointSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      ep.name.toLowerCase().includes(q) ||
      ep.path.toLowerCase().includes(q) ||
      (ep.description && ep.description.toLowerCase().includes(q))
    );
  });

  // Execute request directly
  const executeEndpoint = async (targetUrl?: string, targetMethod?: HttpMethod) => {
    setLoading(true);
    setError(null);

    const baseTarget = targetUrl || url;
    const activeMethod = isAdmin ? (targetMethod || method) : 'GET';
    const activeHeaders: Record<string, string> = {
      'Accept': 'application/json'
    };

    try {
      const res = await apiService.executeRequest(
        baseTarget,
        activeMethod,
        activeHeaders
      );

      if (res.error) {
        setError(res.error);
      }
      setResponse(res);

      // Add to history
      const newHistoryItem: RequestHistoryItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        url: baseTarget,
        method: activeMethod,
        status: res.status,
        durationMs: res.durationMs,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      setHistory(prev => [newHistoryItem, ...prev.slice(0, 7)]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Lỗi gửi yêu cầu: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    executeEndpoint(url, isAdmin ? method : 'GET');
  };

  // When user clicks on an endpoint from the filtered list, auto select and execute GET
  const handleSelectEndpoint = (ep: CustomEndpoint) => {
    setUrl(ep.path);
    const chosenMethod = isAdmin ? ep.method : 'GET';
    setMethod(chosenMethod);
    executeEndpoint(ep.path, chosenMethod);
  };

  const handleCopyResponse = () => {
    if (!response) return;
    const text = response.isJson
      ? JSON.stringify(response.data, null, 2)
      : String(response.data || '');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadResponseJson = () => {
    if (!response) return;
    const jsonString = response.isJson
      ? JSON.stringify(response.data, null, 2)
      : String(response.data || '');
    const blob = new Blob([jsonString], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const filename = url.split('/').pop()?.split('?')[0] || 'response';
    a.download = `${filename}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const getCodeSnippet = () => {
    const activeHeaders: Record<string, string> = {
      'Accept': 'application/json'
    };

    switch (snippetLang) {
      case 'curl':
        return generateCurlSnippet(url, method, activeHeaders);
      case 'fetch':
        return generateFetchSnippet(url, method, activeHeaders);
      case 'python':
        return generatePythonSnippet(url, method, activeHeaders);
      case 'axios':
        return generateAxiosSnippet(url, method, activeHeaders);
      default:
        return '';
    }
  };

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Banner / Hero Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Playground & API Tester</span>
            {!isAdmin && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-medium">
                Chế độ xem GET
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {!isAdmin
              ? 'Lọc danh sách các API có sẵn, bấm chọn để tự động gửi yêu cầu và nhận dữ liệu (GET)'
              : 'Gửi yêu cầu GET hoặc kiểm thử các endpoint tùy chỉnh và API trích xuất từ GitHub'}
          </p>
        </div>

        {/* History & Status Badges */}
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lịch sử ({history.length})</span>
            </button>
          )}

          {!isAdmin && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Chỉ cần bấm là GET</span>
            </div>
          )}
        </div>
      </div>

      {/* History Drawer if toggled */}
      {showHistoryDrawer && history.length > 0 && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Các yêu cầu đã thực hiện gần đây:</span>
            </span>
            <button
              onClick={() => setHistory([])}
              className="text-[11px] text-slate-500 hover:text-rose-400"
            >
              Xóa lịch sử
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {history.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setUrl(item.url);
                  executeEndpoint(item.url, item.method);
                }}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono text-left flex items-center gap-2 transition-colors group"
              >
                <span className="text-emerald-400 font-bold">{item.method}</span>
                <span className="text-slate-300 truncate max-w-xs">{item.url}</span>
                <span className="text-slate-500 text-[10px] tabular-nums">({item.durationMs}ms)</span>
                <span className="text-slate-600 text-[10px]">{item.timestamp}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 🔍 Search Bar & Quick Filter Component for Endpoints */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-white">
                Thanh Tìm Kiếm Điểm Cuối (Endpoints Filter)
              </div>
              <div className="text-[11px] text-slate-400">
                Tìm kiếm theo tên hoặc đường dẫn — Bấm vào thẻ API bất kỳ để GET dữ liệu ngay
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={endpointSearchQuery}
              onChange={e => setEndpointSearchQuery(e.target.value)}
              placeholder="Tìm API (vd: movies, users, public)..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            {endpointSearchQuery && (
              <button
                onClick={() => setEndpointSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs px-1"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 border-t border-slate-800/80 pt-2.5">
          <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">Danh mục:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Tất cả ({endpoints.length})
          </button>
          <button
            onClick={() => setSelectedCategory('curated')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'curated'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            API Tuyển Chọn
          </button>
          <button
            onClick={() => setSelectedCategory('github')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'github'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Nguồn GitHub Repo
          </button>
          <button
            onClick={() => setSelectedCategory('mock')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'mock'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Mock Generator
          </button>
        </div>

        {/* Filtered Endpoints Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {filteredEndpoints.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500 bg-slate-950/60 rounded-lg border border-slate-800/60">
              Không tìm thấy API nào khớp với danh mục và từ khóa "{endpointSearchQuery}".
            </div>
          ) : (
            filteredEndpoints.map(ep => {
              const isSelected = url === ep.path;
              return (
                <button
                  key={ep.id}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 group cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-lg ring-1 ring-indigo-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                  title={`Bấm vào để GET: ${ep.name} (${ep.path})`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                      {ep.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-900/60 shrink-0">
                      GET
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                    <span className="truncate text-indigo-300 group-hover:text-indigo-200">
                      {ep.path}
                    </span>
                    <span className="shrink-0 text-slate-500 text-[10px] tabular-nums">
                      {ep.latencyMs}ms
                    </span>
                  </div>

                  {ep.description && (
                    <div className="text-[11px] text-slate-500 truncate line-clamp-1">
                      {ep.description}
                    </div>
                  )}

                  {/* Subtle active border indicator */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 w-2 h-2 rounded-bl bg-indigo-500" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Request Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Method Selector: locked to GET for regular users */}
          <div className="relative shrink-0">
            {isAdmin ? (
              <select
                value={method}
                onChange={e => setMethod(e.target.value as HttpMethod)}
                className="w-full sm:w-28 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold tracking-wider text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            ) : (
              <div
                className="w-full sm:w-28 px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold tracking-wider text-emerald-400 flex items-center justify-center gap-1.5 select-none font-mono"
                title="Chế độ người dùng: Phương thức cố định GET"
              >
                <span>GET</span>
                <Lock className="w-3 h-3 text-slate-500" />
              </div>
            )}
          </div>

          {/* URL Input: Read-only for regular users, they select from above */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              readOnly={!isAdmin}
              onChange={e => isAdmin && setUrl(e.target.value)}
              placeholder="Bấm chọn một API ở danh sách trên để GET..."
              className={`w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-100 placeholder-slate-600 focus:outline-none ${
                !isAdmin
                  ? 'cursor-pointer focus:border-slate-800'
                  : 'focus:border-indigo-500'
              }`}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
            />

            {!isAdmin && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-medium text-slate-500 pointer-events-none select-none">
                <span>(Bấm chọn để đổi API)</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowCodeModal(true)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Lấy mã nguồn cURL, Fetch, Axios, Python"
            >
              <Code2 className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Lấy Code</span>
            </button>

            <button
              onClick={handleSend}
              disabled={loading || !url.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-colors whitespace-nowrap min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Lấy Dữ Liệu (GET)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Response Display Section */}
      <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl transition-all ${isExpanded ? 'fixed inset-4 z-50 flex flex-col' : ''}`}>
        {/* Response Top Bar with Status, Timing & Payload Size */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Kết Quả Trả Về (Response):
            </span>

            {response && (
              <div className="flex items-center gap-2.5 text-xs">
                <span
                  className={`font-mono font-semibold px-2 py-0.5 rounded text-xs ${
                    response.status >= 200 && response.status < 300
                      ? 'bg-emerald-950/80 border border-emerald-800/80 text-emerald-300'
                      : response.status >= 400
                      ? 'bg-rose-950/80 border border-rose-800/80 text-rose-300'
                      : 'bg-amber-950/80 border border-amber-800/80 text-amber-300'
                  }`}
                >
                  {response.status} {response.statusText || (response.status === 200 ? 'OK' : '')}
                </span>

                <span className="text-slate-600">·</span>
                <span className="text-slate-300 font-mono tabular-nums flex items-center gap-1">
                  <span>{response.durationMs} ms</span>
                  <span className="text-[10px] text-emerald-400">⚡</span>
                </span>

                <span className="text-slate-600">·</span>
                <span className="text-slate-300 font-mono tabular-nums">
                  {(response.sizeBytes / 1024).toFixed(2)} KB
                </span>
              </div>
            )}
          </div>

          {/* Sub tabs and actions */}
          <div className="flex items-center gap-2">
            {response && (
              <>
                <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setResponseView('json')}
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      responseView === 'json'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => setResponseView('raw')}
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      responseView === 'raw'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setResponseView('headers')}
                    className={`px-2.5 py-1 text-xs font-medium rounded ${
                      responseView === 'headers'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Headers
                  </button>
                </div>

                {/* Download JSON Button */}
                <button
                  onClick={handleDownloadResponseJson}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 transition-colors"
                  title="Tải dữ liệu về máy (.json)"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Tải JSON</span>
                </button>

                <button
                  onClick={handleCopyResponse}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1 transition-colors"
                  title="Sao chép toàn bộ kết quả"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>

                {/* Expand / Fullscreen Toggle */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded transition-colors"
                  title={isExpanded ? 'Thu nhỏ lại' : 'Mở rộng toàn màn hình'}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Response Body Area */}
        <div className={`p-4 overflow-auto ${isExpanded ? 'flex-1' : 'min-h-[300px] max-h-[550px]'}`}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium text-slate-300">Đang thực thi request và nhận dữ liệu...</p>
              <p className="text-xs text-slate-500 font-mono">GET {url}</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-300 text-sm">
              <p className="font-semibold mb-1">Yêu cầu gặp sự cố:</p>
              <p className="font-mono text-xs">{error}</p>
            </div>
          ) : !response ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-2.5">
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Sẵn sàng nhận dữ liệu</p>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                Bấm chọn bất kỳ API nào trong danh sách tìm kiếm phía trên để lấy dữ liệu (GET).
              </p>
            </div>
          ) : responseView === 'headers' ? (
            <div className="space-y-1 font-mono text-xs p-2">
              {Object.entries(response.headers).map(([k, v]) => (
                <div key={k} className="flex border-b border-slate-800/60 py-1.5">
                  <span className="w-64 text-indigo-400 font-semibold shrink-0">{k}:</span>
                  <span className="text-slate-300 break-all">{v}</span>
                </div>
              ))}
            </div>
          ) : responseView === 'raw' ? (
            <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap break-all p-3">
              {typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data, null, 2)}
            </pre>
          ) : (
            <JsonSyntaxHighlighter
              data={response.data}
              maxHeight={isExpanded ? 'calc(100vh - 180px)' : '480px'}
            />
          )}
        </div>
      </div>

      {/* Code Snippet Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Mã Nguồn Tích Hợp API
                </h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Language Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800">
              <button
                onClick={() => setSnippetLang('curl')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  snippetLang === 'curl'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setSnippetLang('fetch')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  snippetLang === 'fetch'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                JavaScript (Fetch)
              </button>
              <button
                onClick={() => setSnippetLang('python')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  snippetLang === 'python'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Python (requests)
              </button>
              <button
                onClick={() => setSnippetLang('axios')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  snippetLang === 'axios'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Node.js (Axios)
              </button>
            </div>

            {/* Snippet Content */}
            <div className="p-6">
              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 overflow-x-auto max-h-[350px]">
                  {getCodeSnippet()}
                </pre>
                <button
                  onClick={handleCopySnippet}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {snippetCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{snippetCopied ? 'Đã sao chép' : 'Sao chép mã'}</span>
                </button>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowCodeModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
