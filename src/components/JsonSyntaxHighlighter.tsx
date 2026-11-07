import React, { useMemo, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import { Copy, Check, ChevronDown, ChevronRight, Eye, Code, Search } from 'lucide-react';

interface JsonSyntaxHighlighterProps {
  data: unknown;
  searchQuery?: string;
  maxHeight?: string;
}

export const JsonSyntaxHighlighter: React.FC<JsonSyntaxHighlighterProps> = ({
  data,
  searchQuery = '',
  maxHeight = '500px',
}) => {
  const [viewMode, setViewMode] = useState<'syntax' | 'tree'>('syntax');
  const [copied, setCopied] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  const formattedJson = useMemo(() => {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return data;
      }
    }
    return JSON.stringify(data, null, 2) || '';
  }, [data]);

  // Highlight using Prism
  const highlightedHtml = useMemo(() => {
    if (!formattedJson) return '';
    try {
      return Prism.highlight(formattedJson, Prism.languages.json, 'json');
    } catch {
      return formattedJson;
    }
  }, [formattedJson]);

  // Split lines for line numbers
  const lines = useMemo(() => {
    return highlightedHtml.split('\n');
  }, [highlightedHtml]);

  // Filtered lines if searching
  const filteredLineCount = lines.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
      {/* Syntax Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('syntax')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded flex items-center gap-1.5 transition-colors ${
                viewMode === 'syntax'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Prism Highlight</span>
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded flex items-center gap-1.5 transition-colors ${
                viewMode === 'tree'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Cây Dữ Liệu (Tree)</span>
            </button>
          </div>

          <span className="text-slate-500 font-mono text-[11px]">
            {filteredLineCount} dòng
          </span>
        </div>

        {/* Search & Copy */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc JSON..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="pl-7 pr-3 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-32 sm:w-44"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px]"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={handleCopy}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1.5 transition-colors"
            title="Sao chép JSON đã định dạng"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="overflow-auto font-mono text-xs leading-relaxed p-4"
        style={{ maxHeight }}
      >
        {viewMode === 'syntax' ? (
          <div className="table w-full border-collapse">
            {lines.map((lineHtml, idx) => {
              // Strip tags for search match checking
              const rawLine = lineHtml.replace(/<[^>]+>/g, '');
              const isMatch = localSearch && rawLine.toLowerCase().includes(localSearch.toLowerCase());

              return (
                <div
                  key={idx}
                  className={`table-row hover:bg-slate-900/60 transition-colors ${
                    isMatch ? 'bg-indigo-950/40' : ''
                  }`}
                >
                  {/* Line Number */}
                  <span className="table-cell pr-4 text-right select-none text-slate-600 font-mono text-[11px] w-10 tabular-nums">
                    {idx + 1}
                  </span>

                  {/* Highlighted Code Line */}
                  <span
                    className="table-cell pl-2 text-slate-200 whitespace-pre json-syntax-content"
                    dangerouslySetInnerHTML={{ __html: lineHtml || '&nbsp;' }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-slate-300 text-xs py-1">
            <JsonTreeNode data={data} label="root" isRoot={true} searchQuery={localSearch} />
          </div>
        )}
      </div>
    </div>
  );
};

// Collapsible Interactive Tree Node Component
interface JsonTreeNodeProps {
  data: unknown;
  label?: string;
  isRoot?: boolean;
  searchQuery?: string;
}

const JsonTreeNode: React.FC<JsonTreeNodeProps> = ({
  data,
  label,
  isRoot = false,
  searchQuery = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (data === null) {
    return (
      <div className="py-0.5 font-mono text-[11px]">
        {label && <span className="text-sky-400 font-semibold">{label}: </span>}
        <span className="text-slate-500 italic">null</span>
      </div>
    );
  }

  if (typeof data === 'boolean') {
    return (
      <div className="py-0.5 font-mono text-[11px]">
        {label && <span className="text-sky-400 font-semibold">{label}: </span>}
        <span className="text-pink-400 font-semibold">{String(data)}</span>
      </div>
    );
  }

  if (typeof data === 'number') {
    return (
      <div className="py-0.5 font-mono text-[11px]">
        {label && <span className="text-sky-400 font-semibold">{label}: </span>}
        <span className="text-amber-400 font-mono tabular-nums">{data}</span>
      </div>
    );
  }

  if (typeof data === 'string') {
    const isMatched = searchQuery && data.toLowerCase().includes(searchQuery.toLowerCase());
    return (
      <div className="py-0.5 font-mono text-[11px] truncate">
        {label && <span className="text-sky-400 font-semibold">{label}: </span>}
        <span className={`${isMatched ? 'bg-amber-900/60 text-amber-200 px-1 rounded' : 'text-emerald-400'}`}>
          "{data}"
        </span>
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div className="py-0.5 font-mono text-[11px]">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 cursor-pointer hover:text-white select-none text-slate-300"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
          {label && <span className="text-sky-400 font-semibold">{label}: </span>}
          <span className="text-slate-400">Array({data.length})</span>
          {!isOpen && <span className="text-slate-600"> [...]</span>}
        </div>

        {isOpen && (
          <div className="pl-4 border-l border-slate-800/80 ml-1.5 space-y-0.5 my-0.5">
            {data.map((item, idx) => (
              <JsonTreeNode
                key={idx}
                data={item}
                label={`[${idx}]`}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data as Record<string, unknown>);
    return (
      <div className="py-0.5 font-mono text-[11px]">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 cursor-pointer hover:text-white select-none text-slate-300"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
          {label && <span className="text-sky-400 font-semibold">{label}: </span>}
          <span className="text-slate-400">Object{`{${keys.length}}`}</span>
          {!isOpen && <span className="text-slate-600"> {'{...}'}</span>}
        </div>

        {isOpen && (
          <div className="pl-4 border-l border-slate-800/80 ml-1.5 space-y-0.5 my-0.5">
            {keys.map(k => (
              <JsonTreeNode
                key={k}
                data={(data as Record<string, unknown>)[k]}
                label={k}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div className="text-xs text-slate-400">{String(data)}</div>;
};
