import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileCode,
  FileText,
  Star,
  GitFork,
  ExternalLink,
  Zap,
  Loader2,
  Check,
  Search,
  ArrowRight,
  Copy,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Layers,
  Globe,
  Film,
  Gamepad2,
  Quote,
  BarChart3,
  Terminal,
  Play
} from 'lucide-react';
import { GitHubPreset, GitHubRepoInfo, GitHubSearchResultItem } from '../types';
import { apiService } from '../services/apiService';
import { JsonSyntaxHighlighter } from './JsonSyntaxHighlighter';

interface GitHubToApiViewProps {
  onConvertToCustomApi: (data: {
    name: string;
    path: string;
    repo: string;
    filePath: string;
    branch: string;
    sampleBody: string;
    isJson: boolean;
  }) => void;
  onTestInPlayground: (url: string) => void;
  isAdmin: boolean;
  onOpenLoginModal: () => void;
}

type CategoryFilter = 'all' | 'movies' | 'geography' | 'gaming' | 'tech' | 'quotes' | 'analytics';

export const GitHubToApiView: React.FC<GitHubToApiViewProps> = ({
  onConvertToCustomApi,
  onTestInPlayground,
  isAdmin,
  onOpenLoginModal,
}) => {
  // Input & search state
  const [repoInput, setRepoInput] = useState<string>('ozlerhakan/mongodb-json-files');
  const [presets, setPresets] = useState<GitHubPreset[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [showGuide, setShowGuide] = useState<boolean>(true);

  // GitHub Live Search state
  const [searchMode, setSearchMode] = useState<'curated' | 'search'>('curated');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<GitHubSearchResultItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Active Repo inspection state
  const [loading, setLoading] = useState<boolean>(false);
  const [repoInfo, setRepoInfo] = useState<GitHubRepoInfo | null>(null);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // File search filter inside repo
  const [fileFilterQuery, setFileFilterQuery] = useState<string>('');

  // Selected file preview
  const [selectedFile, setSelectedFile] = useState<string | null>('datasets/movies.json');
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [fileData, setFileData] = useState<{
    repo: string;
    branch: string;
    path: string;
    isJson: boolean;
    data: unknown;
    rawText: string;
    sizeBytes: number;
    lineCount: number;
  } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rawCopied, setRawCopied] = useState<boolean>(false);

  // Load presets on mount
  useEffect(() => {
    apiService.getGitHubPresets().then(setPresets).catch(() => {});
    handleInspect('ozlerhakan/mongodb-json-files');
  }, []);

  const handleInspect = async (repoToInspect?: string) => {
    const target = repoToInspect || repoInput.trim();
    if (!target) return;

    setLoading(true);
    setInspectError(null);
    setRepoInfo(null);
    setSelectedFile(null);
    setFileData(null);

    try {
      const data = await apiService.inspectGitHubRepo(target);
      setRepoInfo(data);
      setRepoInput(data.fullName);

      // Auto select first JSON file or README
      if (data.contents && data.contents.length > 0) {
        const candidate =
          data.contents.find(f => f.name.endsWith('.json')) ||
          data.contents.find(f => f.name.toLowerCase().includes('readme')) ||
          data.contents[0];

        if (candidate) {
          handleSelectFile(data.fullName, candidate.path, data.defaultBranch);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setInspectError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async (repo: string, filePath: string, branch = 'main') => {
    setSelectedFile(filePath);
    setFileLoading(true);
    setFileError(null);

    try {
      const data = await apiService.getGitHubFile(repo, filePath, branch);
      setFileData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFileError(msg);
    } finally {
      setFileLoading(false);
    }
  };

  // Perform live search on GitHub
  const handleSearchGitHub = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await apiService.searchGitHubRepos(q);
      setSearchResults(res.items);
      if (res.items.length === 0) {
        setSearchError(`Không tìm thấy repo nào chứa JSON cho từ khóa "${q}". Thử từ khóa khác như "pokemon", "weather", "crypto"...`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSearchError(msg);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConvertCurrentFile = () => {
    if (!isAdmin) {
      onOpenLoginModal();
      return;
    }

    if (!repoInfo || !selectedFile || !fileData) return;

    const baseName = selectedFile.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'dataset';
    const cleanPath = `/api/custom/v1/${baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;

    onConvertToCustomApi({
      name: `GitHub: ${repoInfo.name}/${baseName}`,
      path: cleanPath,
      repo: repoInfo.fullName,
      filePath: selectedFile,
      branch: repoInfo.defaultBranch || 'main',
      sampleBody: fileData.isJson ? JSON.stringify(fileData.data, null, 2) : fileData.rawText,
      isJson: fileData.isJson,
    });
  };

  const handleCopyRawUrl = () => {
    if (!fileData) return;
    const rawUrl = `https://raw.githubusercontent.com/${fileData.repo}/${fileData.branch}/${fileData.path}`;
    navigator.clipboard.writeText(rawUrl);
    setRawCopied(true);
    setTimeout(() => setRawCopied(false), 2000);
  };

  const filteredContents = repoInfo?.contents?.filter(item => {
    if (!fileFilterQuery.trim()) return true;
    return item.name.toLowerCase().includes(fileFilterQuery.toLowerCase());
  }) || [];

  const filteredPresets = presets.filter(p => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-400" />
              <span>Tìm Hiểu Repo GitHub & Tạo REST API</span>
            </h1>
            <span className="text-[11px] font-semibold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded-full">
              Khám Phá Repo
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Khám phá các kho lưu trữ GitHub, đọc các tệp dữ liệu JSON/CSV và biến chúng thành REST API sẵn sàng GET trong 30 giây.
          </p>
        </div>

        {/* Toggle Guide Button */}
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span>{showGuide ? 'Ẩn Hướng Dẫn' : 'Xem Cách Tạo API'}</span>
          {showGuide ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>
      </div>

      {/* Step-by-Step Educational Guide Card */}
      {showGuide && (
        <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-900/50 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Làm sao để tạo API & tìm hiểu các repo? (Quy trình 3 bước)
              </h2>
            </div>
            <span className="text-xs text-indigo-300 font-medium hidden sm:inline">
              Không cần viết code backend · Hoạt động với mọi repo GitHub công khai
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative group hover:border-indigo-600/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Khám Phá & Chọn Repo
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nhập link GitHub bất kỳ (ví dụ: <code className="text-indigo-300 font-mono">owner/repo</code>) hoặc chọn từ các repo mẫu như <strong>MongoDB Movies</strong>, <strong>Pokemon Pokedex</strong>, <strong>Countries</strong> ở bên dưới.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Search className="w-3 h-3 text-slate-400" />
                <span>Tìm kiếm theo chủ đề hoặc link trực tiếp</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative group hover:border-indigo-600/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Duyệt File & Xem Trước JSON
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Hệ thống tự động quét cây thư mục. Nhấp vào các tệp <code className="text-emerald-300 font-mono">.json</code> hoặc <code className="text-sky-300 font-mono">.csv</code> để xem cấu trúc dữ liệu với tô màu cú pháp Prism.js.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-slate-500">
                <FileCode className="w-3 h-3 text-slate-400" />
                <span>Kiểm tra định dạng & cấu trúc bản ghi</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative group hover:border-emerald-600/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Nhấn "Biến Thành API" & GET
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nhấn nút xanh <strong>"Biến File Này Thành API Riêng"</strong>. Hệ thống sẽ tự động đăng ký endpoint <code className="text-emerald-300 font-mono">/api/custom/v1/...</code> với bộ lọc phân trang và tìm kiếm sẵn có.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <Zap className="w-3 h-3" />
                <span>Sẵn sàng test GET ngay trong Playground</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selector Tabs: Curated Presets vs Live GitHub Search vs Direct URL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSearchMode('curated')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                searchMode === 'curated'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Kho Repo Dữ Liệu Tuyển Chọn</span>
            </button>

            <button
              onClick={() => setSearchMode('search')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                searchMode === 'search'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm Kiếm Repo Trên GitHub</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API Raw Engine: Đang kết nối trực tiếp GitHub</span>
          </div>
        </div>

        {/* Tab 1: Curated Presets Mode */}
        {searchMode === 'curated' && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1 text-xs">Chủ đề:</span>
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Tất Cả ({presets.length})
              </button>
              <button
                onClick={() => setActiveCategory('movies')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                  activeCategory === 'movies'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Film className="w-3 h-3" />
                <span>Phim Ảnh & Sách</span>
              </button>
              <button
                onClick={() => setActiveCategory('geography')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                  activeCategory === 'geography'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Quốc Gia & Bản Đồ</span>
              </button>
              <button
                onClick={() => setActiveCategory('gaming')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                  activeCategory === 'gaming'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Gamepad2 className="w-3 h-3" />
                <span>Pokemon & Game</span>
              </button>
              <button
                onClick={() => setActiveCategory('tech')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                  activeCategory === 'tech'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Terminal className="w-3 h-3" />
                <span>Public APIs</span>
              </button>
              <button
                onClick={() => setActiveCategory('quotes')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                  activeCategory === 'quotes'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Quote className="w-3 h-3" />
                <span>Danh Ngôn</span>
              </button>
              <button
                onClick={() => setActiveCategory('analytics')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                  activeCategory === 'analytics'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>Thống Kê Dữ Liệu</span>
              </button>
            </div>

            {/* Curated Repo Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {filteredPresets.map(preset => {
                const isSelected = repoInfo?.fullName === preset.repo;
                return (
                  <button
                    key={preset.repo}
                    onClick={() => {
                      setRepoInput(preset.repo);
                      handleInspect(preset.repo);
                    }}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 group ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {preset.name}
                        </span>
                        <span className="text-[11px] font-mono text-amber-400 flex items-center gap-0.5 shrink-0">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {preset.stars}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <span className="font-mono text-[10px] text-indigo-400 truncate max-w-[170px]">
                        {preset.repo}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white flex items-center gap-0.5">
                        <span>Đọc repo</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Live GitHub Search Mode */}
        {searchMode === 'search' && (
          <div className="space-y-4">
            <form onSubmit={handleSearchGitHub} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm bất kỳ repo nào trên GitHub (vd: pokemon, weather, crypto, vietnam, movies)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={searchLoading || !searchQuery.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm"
              >
                {searchLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Tìm Trên GitHub</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick search suggestions */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 text-[11px]">Từ khóa gợi ý:</span>
              {['pokemon', 'movies', 'weather', 'countries', 'quotes', 'crypto', 'ecommerce'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    apiService.searchGitHubRepos(tag).then(res => setSearchResults(res.items)).catch(() => {});
                  }}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-indigo-300 hover:border-indigo-800 transition-colors font-mono"
                >
                  #{tag}
                </button>
              ))}
            </div>

            {searchError && (
              <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-lg text-amber-300 text-xs">
                {searchError}
              </div>
            )}

            {/* Search Results Grid */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {searchResults.map(item => (
                  <div
                    key={item.repo}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-indigo-600/70 transition-all flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-white truncate">
                          {item.repo}
                        </span>
                        <span className="text-[11px] font-mono text-amber-400 flex items-center gap-0.5 shrink-0">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {item.stars}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {item.description || 'Không có mô tả chi tiết từ tác giả GitHub.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {item.language || 'JSON / Data'}
                      </span>
                      <button
                        onClick={() => {
                          setRepoInput(item.repo);
                          handleInspect(item.repo);
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Quét & Đọc Repo</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Repo URL Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-2">
          <div className="flex-1 relative w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
              github.com/
            </span>
            <input
              type="text"
              value={repoInput}
              onChange={e => setRepoInput(e.target.value)}
              placeholder="nhập-owner/ten-repo hoặc dán link repo GitHub..."
              className="w-full pl-28 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 shadow-inner"
              onKeyDown={e => {
                if (e.key === 'Enter') handleInspect();
              }}
            />
          </div>

          <button
            onClick={() => handleInspect()}
            disabled={loading || !repoInput.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap border border-slate-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang quét...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                <span>Quét Cấu Trúc Repo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {inspectError && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-xl text-rose-300 text-sm">
          <p className="font-semibold mb-1">Không thể đọc repository:</p>
          <p className="font-mono text-xs">{inspectError}</p>
          <p className="text-xs text-rose-400 mt-2">
            Gợi ý: Đảm bảo đây là repo công khai (Public) và đúng định dạng <code className="bg-rose-900/50 px-1 py-0.5 rounded">owner/repo</code>.
          </p>
        </div>
      )}

      {/* Main Two-Column View: Repo Explorer (Left) & File Preview / API Converter (Right) */}
      {repoInfo && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Repository Info & Files Tree (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Repo Info Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>{repoInfo.fullName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {repoInfo.description || 'Không có mô tả chi tiết từ GitHub.'}
                  </p>
                </div>
                <a
                  href={`https://github.com/${repoInfo.fullName}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-950 rounded border border-slate-800 hover:border-slate-700 transition-colors"
                  title="Mở trên GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Repo Stats Row */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono tabular-nums text-slate-300">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {repoInfo.stars.toLocaleString()}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-mono tabular-nums text-slate-300">
                  <GitFork className="w-3.5 h-3.5 text-slate-400" />
                  {repoInfo.forks.toLocaleString()}
                </span>
                <span>·</span>
                <span>Branch: <code className="text-indigo-300 font-mono">{repoInfo.defaultBranch}</code></span>
              </div>
            </div>

            {/* Files List with Quick File Filter */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tệp dữ liệu trong repo ({filteredContents.length})</span>
                  </span>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    Ưu tiên file .json
                  </span>
                </div>

                {/* File quick search filter */}
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fileFilterQuery}
                    onChange={e => setFileFilterQuery(e.target.value)}
                    placeholder="Lọc file theo tên (vd: .json, movies, data)..."
                    className="w-full pl-7 pr-3 py-1 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto">
                {filteredContents.length > 0 ? (
                  filteredContents.map(item => {
                    const isSelected = selectedFile === item.path;
                    const isJson = item.name.endsWith('.json');
                    const isMd = item.name.endsWith('.md');
                    const isCsv = item.name.endsWith('.csv');

                    return (
                      <button
                        key={item.path}
                        onClick={() => handleSelectFile(repoInfo.fullName, item.path, repoInfo.defaultBranch)}
                        className={`w-full px-4 py-2.5 text-left text-xs flex items-center justify-between gap-3 transition-colors ${
                          isSelected
                            ? 'bg-indigo-950/80 text-indigo-200 font-medium border-l-2 border-indigo-500'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {item.type === 'dir' ? (
                            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : isJson ? (
                            <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isCsv ? (
                            <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                          ) : isMd ? (
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <span className={`font-mono truncate ${isJson ? 'font-semibold text-emerald-300' : ''}`}>
                            {item.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-slate-500 font-mono text-[11px]">
                          {item.size ? `${(item.size / 1024).toFixed(1)} KB` : ''}
                          {isJson && (
                            <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-900/60">
                              JSON
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500">
                    Không tìm thấy file nào khớp với "{fileFilterQuery}".
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: File Inspector & Instant "Convert to Custom API" Box (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              {/* Header of file preview */}
              <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="text-xs font-mono font-bold text-white truncate max-w-xs sm:max-w-md">
                    {selectedFile || 'Chưa chọn file nào'}
                  </span>

                  {fileData && (
                    <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                      · {fileData.lineCount} dòng · {(fileData.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>

                {/* Primary Action Button: Convert to API */}
                {fileData && (
                  <button
                    onClick={handleConvertCurrentFile}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm whitespace-nowrap ${
                      isAdmin
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{isAdmin ? '⚡ Biến File Này Thành API Riêng' : 'Đăng Nhập Admin Để Tạo API Này'}</span>
                  </button>
                )}
              </div>

              {/* Informational Callout when file is JSON */}
              {fileData && fileData.isJson && (
                <div className="px-5 py-2.5 bg-indigo-950/30 border-b border-indigo-900/40 flex items-center justify-between gap-3 text-xs text-indigo-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Dữ liệu hợp lệ chuẩn JSON. Khi chuyển đổi, API sẽ sẵn sàng tại:{' '}
                      <code className="text-emerald-300 font-mono font-semibold">
                        /api/custom/v1/{selectedFile?.split('/').pop()?.replace(/\.[^/.]+$/, '').toLowerCase()}
                      </code>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap hidden sm:inline">
                    Hỗ trợ ?limit=&search=
                  </span>
                </div>
              )}

              {/* File Content Preview */}
              <div className="p-4 min-h-[380px] max-h-[550px] overflow-auto">
                {fileLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
                    <p className="text-xs">Đang đọc nội dung file trực tiếp từ GitHub...</p>
                  </div>
                ) : fileError ? (
                  <div className="p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-300 text-xs">
                    {fileError}
                  </div>
                ) : !fileData ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-500 text-xs">
                    Chọn một file bên trái để xem trước và tạo REST API.
                  </div>
                ) : fileData.isJson ? (
                  <JsonSyntaxHighlighter
                    data={fileData.data}
                    maxHeight="460px"
                  />
                ) : (
                  <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap p-4 bg-slate-950 rounded-xl border border-slate-800">
                    {fileData.rawText}
                  </pre>
                )}
              </div>

              {/* Bottom Quick Bar */}
              {fileData && (
                <div className="px-5 py-3 bg-slate-950/70 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 truncate max-w-sm font-mono text-[11px]">
                      raw.githubusercontent.com/{fileData.repo}/{fileData.branch}/{fileData.path}
                    </span>
                    <button
                      onClick={handleCopyRawUrl}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Sao chép link raw URL"
                    >
                      {rawCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      const rawUrl = `https://raw.githubusercontent.com/${fileData.repo}/${fileData.branch}/${fileData.path}`;
                      onTestInPlayground(rawUrl);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Thử nghiệm trong Playground (GET)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
