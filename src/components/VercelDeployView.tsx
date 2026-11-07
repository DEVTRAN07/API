import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  Folder,
  Terminal,
  ExternalLink,
  Zap,
  ShieldCheck,
  Globe,
  Sparkles
} from 'lucide-react';
import { CustomEndpoint } from '../types';
import { generateVercelFiles, downloadVercelZip, VercelPackageFiles } from '../services/vercelExporter';

interface VercelDeployViewProps {
  endpoints: CustomEndpoint[];
}

export const VercelDeployView: React.FC<VercelDeployViewProps> = ({ endpoints }) => {
  const [selectedFileName, setSelectedFileName] = useState<keyof VercelPackageFiles>('vercel.json');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [cmdCopied, setCmdCopied] = useState<boolean>(false);

  const files = generateVercelFiles(endpoints);
  const currentContent = files[selectedFileName];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadVercelZip(endpoints);
    } catch (err: unknown) {
      alert('Lỗi tải file zip: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCliCommand = () => {
    navigator.clipboard.writeText('npm install -g vercel && vercel');
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Trung Tâm Triển Khai Vercel Serverless</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Đóng gói toàn bộ API của bạn thành cấu trúc Vercel Serverless Functions chuẩn, sẵn sàng chạy ngay 100% miễn phí
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white rounded-lg text-xs font-semibold shadow-lg transition-colors whitespace-nowrap shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Đang nén ZIP...' : 'Tải Về Trọn Bộ Mã Nguồn (.ZIP)'}</span>
        </button>
      </div>

      {/* Highlights Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 bg-indigo-950/60 border border-indigo-700/50 rounded-lg text-indigo-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Vercel Serverless Function</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Mỗi request API được xử lý tự động theo cơ chế serverless scale-to-zero, không tốn chi phí duy trì máy chủ.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-700/50 rounded-lg text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Tích Hợp CORS Toàn Diện</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tập tin <code>vercel.json</code> đã thiết lập sẵn header CORS cho phép gọi từ web app, mobile hoặc bất kỳ client nào.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3.5">
          <div className="p-2.5 bg-sky-950/60 border border-sky-700/50 rounded-lg text-sky-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Đồng Bộ Dữ Liệu GitHub</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Hỗ trợ kéo dữ liệu trực tiếp từ các file trong GitHub repo với bộ nhớ đệm cache thông minh.
            </p>
          </div>
        </div>
      </div>

      {/* Main Code Viewer & File Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12">
        {/* Left: File Tree Explorer (3 cols) */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Folder className="w-4 h-4 text-amber-400" />
            <span>Cấu Trúc Thư Mục Vercel</span>
          </div>

          <div className="space-y-1">
            {(
              [
                'vercel.json',
                'api/[...path].ts',
                'endpoints.json',
                'package.json',
                'tsconfig.json',
                'README.md',
                '.gitignore',
              ] as Array<keyof VercelPackageFiles>
            ).map(fileName => {
              const isSelected = selectedFileName === fileName;
              return (
                <button
                  key={fileName}
                  onClick={() => setSelectedFileName(fileName)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-mono text-left flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? 'bg-indigo-950/80 border border-indigo-700/60 text-indigo-200'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{fileName}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            📁 Thư mục <code className="text-indigo-400">api/</code> là nơi Vercel tự động biến các file TypeScript thành Serverless API Route.
          </div>
        </div>

        {/* Right: Code Inspector (9 cols) */}
        <div className="lg:col-span-9 flex flex-col">
          <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono font-semibold text-white">
                {selectedFileName}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Đã sao chép' : 'Sao chép file này'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 flex-1 min-h-[420px] max-h-[550px] overflow-auto">
            <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre">
              {currentContent}
            </pre>
          </div>
        </div>
      </div>

      {/* Step by Step Deploy Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400" />
          <span>Hướng Dẫn Triển Khai Lên Vercel Trong 30 Giây</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: Vercel CLI */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Cách 1: Triển khai qua Vercel CLI (Khuyên dùng)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">30 giây</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              1. Tải file ZIP ở trên về máy tính và giải nén vào một thư mục.<br />
              2. Mở Terminal (hoặc CMD/PowerShell) tại thư mục đó và chạy lệnh:
            </p>

            <div className="relative">
              <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400">
                npm install -g vercel && vercel
              </pre>
              <button
                onClick={handleCopyCliCommand}
                className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded"
                title="Sao chép lệnh"
              >
                {cmdCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              3. Vercel sẽ tự động cấp phát domain HTTPS miễn phí dạng <code>https://ten-du-an.vercel.app</code> cho bạn!
            </p>
          </div>

          {/* Option B: Git Push */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Cách 2: Đẩy lên GitHub rồi kết nối Vercel
              </span>
              <span className="text-[11px] text-slate-500 font-mono">1 phút</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              1. Tạo một repository mới trên GitHub (public hoặc private).<br />
              2. Khởi tạo git và push mã nguồn đã tải về:<br />
            </p>

            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-300">
              git init{'\n'}
              git add .{'\n'}
              git commit -m "Deploy GitAPI"{'\n'}
              git push -u origin main
            </pre>

            <p className="text-xs text-slate-400 leading-relaxed">
              3. Mở <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">vercel.com</a>, chọn <strong>Import Git Repository</strong>. Vercel sẽ tự động build và cấp domain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
