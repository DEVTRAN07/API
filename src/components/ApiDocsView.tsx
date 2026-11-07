import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  Play,
  GitFork,
  ListFilter,
  Search,
  Layers,
  Server
} from 'lucide-react';
import { CustomEndpoint, HttpMethod } from '../types';
import { ApiArchitectureDiagram } from './ApiArchitectureDiagram';

interface ApiDocsViewProps {
  endpoints: CustomEndpoint[];
  onTestInPlayground: (url: string, method?: HttpMethod) => void;
}

export const ApiDocsView: React.FC<ApiDocsViewProps> = ({
  endpoints,
  onTestInPlayground,
}) => {
  const [viewMode, setViewMode] = useState<'diagram' | 'list'>('diagram');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');

  const filteredEndpoints = endpoints.filter(ep =>
    ep.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    ep.path.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (ep.description && ep.description.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(window.location.origin + path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* View Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Danh Mục & Kiến Trúc API (API Catalog)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi sơ đồ đồ họa mối quan hệ giữa các endpoint và tra cứu thông số kỹ thuật chi tiết
          </p>
        </div>

        {/* View Mode Toggle: Diagram vs Detailed List */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('diagram')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === 'diagram'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Sơ Đồ Đồ Họa</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Danh Sách Chi Tiết</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Tổng Endpoints
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1 tabular-nums">
            {endpoints.length}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Nguồn Dữ Liệu GitHub
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1 tabular-nums">
            {endpoints.filter(e => e.sourceType === 'github_raw').length}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            JSON Cục Bộ & Mock
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1 tabular-nums">
            {endpoints.filter(e => e.sourceType !== 'github_raw').length}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
            Vercel Serverless
          </div>
          <div className="text-xl font-bold text-indigo-400 font-mono mt-1">
            Sẵn Sàng
          </div>
        </div>
      </div>

      {/* 1. Diagram View Mode */}
      {viewMode === 'diagram' && (
        <div className="space-y-6">
          <ApiArchitectureDiagram
            endpoints={endpoints}
            onTestInPlayground={onTestInPlayground}
          />
        </div>
      )}

      {/* 2. Detailed List View Mode */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Filter search bar */}
          <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm API theo tên hoặc path (vd: movies, public-apis)..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400 whitespace-nowrap">
              Hiển thị {filteredEndpoints.length} trên {endpoints.length} APIs
            </div>
          </div>

          {/* Endpoints Detail Cards */}
          <div className="space-y-6">
            {filteredEndpoints.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-sm text-slate-400">
                Không tìm thấy API nào khớp với từ khóa tìm kiếm.
              </div>
            ) : (
              filteredEndpoints.map(ep => (
                <div
                  key={ep.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg"
                >
                  {/* Endpoint Header Bar */}
                  <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                          ep.method === 'GET'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                            : 'bg-sky-950/80 text-sky-300 border border-sky-800/80'
                        }`}
                      >
                        {ep.method}
                      </span>

                      <span className="font-mono text-sm font-bold text-white">
                        {ep.path}
                      </span>

                      <button
                        onClick={() => handleCopy(ep.path)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Sao chép URL"
                      >
                        {copiedPath === ep.path ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">
                        Status: <span className="text-emerald-400 font-semibold">{ep.statusCode}</span>
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-400 font-mono">
                        Delay: <span className="text-indigo-400 font-semibold">{ep.latencyMs}ms</span>
                      </span>

                      <button
                        onClick={() => onTestInPlayground(ep.path, ep.method)}
                        className="ml-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Play className="w-3 h-3" />
                        <span>Thử Nghiệm Ngay</span>
                      </button>
                    </div>
                  </div>

                  {/* Endpoint Body */}
                  <div className="p-5 space-y-4">
                    {/* Description & Origin */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">{ep.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ep.description || 'Không có mô tả bổ sung.'}
                      </p>

                      {ep.sourceType === 'github_raw' && ep.githubRepo && (
                        <div className="mt-2 text-xs font-mono text-indigo-400">
                          GitHub Source: <a href={`https://github.com/${ep.githubRepo}`} target="_blank" rel="noreferrer" className="underline">{ep.githubRepo}</a> / {ep.githubFilePath}
                        </div>
                      )}
                    </div>

                    {/* Parameters Supported */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Tham số Query URL (Hỗ trợ tự động):
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-slate-800 text-slate-400 bg-slate-900/60 font-medium">
                            <tr>
                              <th className="px-3.5 py-2 font-mono">Parameter</th>
                              <th className="px-3.5 py-2">Loại</th>
                              <th className="px-3.5 py-2">Mô tả</th>
                              <th className="px-3.5 py-2">Ví dụ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                            <tr>
                              <td className="px-3.5 py-2 text-indigo-300 font-semibold">limit</td>
                              <td className="px-3.5 py-2 text-slate-400">number</td>
                              <td className="px-3.5 py-2 font-sans">Giới hạn số lượng bản ghi trả về</td>
                              <td className="px-3.5 py-2 text-emerald-400">{ep.path}?limit=5</td>
                            </tr>
                            <tr>
                              <td className="px-3.5 py-2 text-indigo-300 font-semibold">search</td>
                              <td className="px-3.5 py-2 text-slate-400">string</td>
                              <td className="px-3.5 py-2 font-sans">Tìm kiếm chuỗi ký tự trong mảng JSON</td>
                              <td className="px-3.5 py-2 text-emerald-400">{ep.path}?search=pro</td>
                            </tr>
                            <tr>
                              <td className="px-3.5 py-2 text-indigo-300 font-semibold">page</td>
                              <td className="px-3.5 py-2 text-slate-400">number</td>
                              <td className="px-3.5 py-2 font-sans">Phân trang (kết hợp với limit)</td>
                              <td className="px-3.5 py-2 text-emerald-400">{ep.path}?limit=10&page=2</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Response Preview */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Dữ Liệu JSON Mẫu Trả Về (200 OK):
                      </div>
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 max-h-56 overflow-auto">
                        {ep.responseBody}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
