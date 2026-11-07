import React, { useState, useMemo, useRef } from 'react';
import {
  GitFork,
  Globe,
  Database,
  Server,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { CustomEndpoint, HttpMethod } from '../types';

interface ApiArchitectureDiagramProps {
  endpoints: CustomEndpoint[];
  onTestInPlayground: (url: string, method?: HttpMethod) => void;
}

interface NodeItem {
  id: string;
  type: 'gateway' | 'group' | 'endpoint' | 'source';
  title: string;
  subtitle?: string;
  method?: HttpMethod;
  x: number;
  y: number;
  width: number;
  height: number;
  endpointData?: CustomEndpoint;
  sourceType?: string;
}

interface LinkItem {
  fromId: string;
  toId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  label?: string;
}

export const ApiArchitectureDiagram: React.FC<ApiArchitectureDiagramProps> = ({
  endpoints,
  onTestInPlayground,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<CustomEndpoint | null>(endpoints[0] || null);
  const [zoom, setZoom] = useState<number>(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'github' | 'static' | 'mock'>('all');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Filter endpoints according to activeFilter
  const visibleEndpoints = useMemo(() => {
    if (activeFilter === 'all') return endpoints;
    return endpoints.filter(ep => {
      if (activeFilter === 'github') return ep.sourceType === 'github_raw';
      if (activeFilter === 'static') return ep.sourceType === 'static_json';
      if (activeFilter === 'mock') return ep.sourceType === 'mock_generator';
      return true;
    });
  }, [endpoints, activeFilter]);

  // Compute Layout for Diagram Nodes & Links
  const { nodes, links, svgWidth, svgHeight } = useMemo(() => {
    const calculatedNodes: NodeItem[] = [];
    const calculatedLinks: LinkItem[] = [];

    const startX = 60;
    const gatewayX = 260;
    const groupX = 520;
    const endpointX = 820;
    const sourceX = 1140;

    const nodeWidth = 220;
    const nodeHeight = 56;
    const epNodeHeight = 64;

    // 1. Client / Consumer Node
    const clientNode: NodeItem = {
      id: 'node-client',
      type: 'gateway',
      title: 'Client Consumers',
      subtitle: 'Web Apps, Mobile, cURL',
      x: startX,
      y: 180,
      width: 170,
      height: nodeHeight,
    };
    calculatedNodes.push(clientNode);

    // 2. Gateway Node
    const gatewayNode: NodeItem = {
      id: 'node-gateway',
      type: 'gateway',
      title: 'GitAPI Hub & Vercel',
      subtitle: 'Serverless Edge Engine',
      x: gatewayX,
      y: 180,
      width: 190,
      height: nodeHeight,
    };
    calculatedNodes.push(gatewayNode);

    // Link Client -> Gateway
    calculatedLinks.push({
      fromId: clientNode.id,
      toId: gatewayNode.id,
      startX: clientNode.x + clientNode.width,
      startY: clientNode.y + clientNode.height / 2,
      endX: gatewayNode.x,
      endY: gatewayNode.y + gatewayNode.height / 2,
      color: '#6366f1',
      label: 'HTTPS / JSON',
    });

    // 3. Domain Groups (group by path prefix)
    const groupsMap = new Map<string, CustomEndpoint[]>();
    visibleEndpoints.forEach(ep => {
      // Extract prefix e.g. "v1" or "dataset"
      const parts = ep.path.split('/').filter(Boolean);
      const groupKey = parts.length >= 3 ? parts[2] : 'general';
      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, []);
      }
      groupsMap.get(groupKey)!.push(ep);
    });

    const groupKeys = Array.from(groupsMap.keys());
    const groupSpacing = 160;
    const startGroupY = Math.max(40, 200 - (groupKeys.length * groupSpacing) / 2);

    groupKeys.forEach((gKey, idx) => {
      const gY = startGroupY + idx * groupSpacing;
      const gNodeId = `node-group-${gKey}`;
      const groupNode: NodeItem = {
        id: gNodeId,
        type: 'group',
        title: `Domain: /${gKey}`,
        subtitle: `${groupsMap.get(gKey)?.length} active endpoints`,
        x: groupX,
        y: gY,
        width: 180,
        height: nodeHeight,
      };
      calculatedNodes.push(groupNode);

      // Link Gateway -> Group
      calculatedLinks.push({
        fromId: gatewayNode.id,
        toId: gNodeId,
        startX: gatewayNode.x + gatewayNode.width,
        startY: gatewayNode.y + gatewayNode.height / 2,
        endX: groupNode.x,
        endY: groupNode.y + groupNode.height / 2,
        color: '#8b5cf6',
      });
    });

    // 4. Endpoints Nodes
    const epSpacing = 85;
    const totalEpHeight = Math.max(visibleEndpoints.length * epSpacing, 480);
    const startEpY = 30;

    visibleEndpoints.forEach((ep, idx) => {
      const epY = startEpY + idx * epSpacing;
      const epNodeId = `node-ep-${ep.id}`;
      const parts = ep.path.split('/').filter(Boolean);
      const groupKey = parts.length >= 3 ? parts[2] : 'general';
      const gNodeId = `node-group-${groupKey}`;

      const epNode: NodeItem = {
        id: epNodeId,
        type: 'endpoint',
        title: ep.name,
        subtitle: ep.path,
        method: ep.method,
        x: endpointX,
        y: epY,
        width: nodeWidth,
        height: epNodeHeight,
        endpointData: ep,
      };
      calculatedNodes.push(epNode);

      // Link Group -> Endpoint
      const gNode = calculatedNodes.find(n => n.id === gNodeId);
      if (gNode) {
        calculatedLinks.push({
          fromId: gNode.id,
          toId: epNodeId,
          startX: gNode.x + gNode.width,
          startY: gNode.y + gNode.height / 2,
          endX: epNode.x,
          endY: epNode.y + epNode.height / 2,
          color: ep.method === 'GET' ? '#10b981' : '#38bdf8',
        });
      }

      // 5. Data Source Nodes (GitHub, Mock, Static)
      const sourceNodeId = `node-source-${ep.id}`;
      let srcTitle = 'Static JSON Store';
      let srcSubtitle = 'Bộ nhớ JSON cục bộ';
      let srcColor = '#a855f7';

      if (ep.sourceType === 'github_raw') {
        srcTitle = 'GitHub Raw Source';
        srcSubtitle = ep.githubRepo || 'github.com';
        srcColor = '#f59e0b';
      } else if (ep.sourceType === 'mock_generator') {
        srcTitle = 'Mock Data Generator';
        srcSubtitle = `Dynamic ${ep.mockType || 'data'}`;
        srcColor = '#06b6d4';
      }

      const sourceNode: NodeItem = {
        id: sourceNodeId,
        type: 'source',
        title: srcTitle,
        subtitle: srcSubtitle,
        x: sourceX,
        y: epY + 4,
        width: 190,
        height: nodeHeight,
        sourceType: ep.sourceType,
        endpointData: ep,
      };
      calculatedNodes.push(sourceNode);

      // Link Endpoint -> Data Source
      calculatedLinks.push({
        fromId: epNodeId,
        toId: sourceNodeId,
        startX: epNode.x + epNode.width,
        startY: epNode.y + epNode.height / 2,
        endX: sourceNode.x,
        endY: sourceNode.y + sourceNode.height / 2,
        color: srcColor,
      });
    });

    const computedWidth = sourceX + 240;
    const computedHeight = Math.max(totalEpHeight + 80, 520);

    return {
      nodes: calculatedNodes,
      links: calculatedLinks,
      svgWidth: computedWidth,
      svgHeight: computedHeight,
    };
  }, [visibleEndpoints]);

  return (
    <div className="flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Diagram Control Bar */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Sơ Đồ Mối Quan Hệ Kiến Trúc API (API Architecture Graph)
            </h3>
            <p className="text-[11px] text-slate-400">
              Trực quan hóa luồng dữ liệu từ Client qua Gateway tới từng Endpoint và Nguồn dữ liệu GitHub / Mock
            </p>
          </div>
        </div>

        {/* Filters and Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Source filters */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeFilter === 'all'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả ({endpoints.length})
            </button>
            <button
              onClick={() => setActiveFilter('github')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeFilter === 'github'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nguồn GitHub
            </button>
            <button
              onClick={() => setActiveFilter('static')}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeFilter === 'static'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JSON Cục Bộ
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.15))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1.5 select-none tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(1.4, prev + 0.15))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title="Phóng to"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title="Đặt lại zoom chuẩn"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Diagram Canvas */}
      <div className="relative overflow-auto p-4 bg-slate-950/90 min-h-[460px] max-h-[580px]">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: svgWidth,
            height: svgHeight,
            transition: 'transform 0.15s ease-out',
          }}
          className="relative select-none"
        >
          {/* SVG Links Layer */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={svgWidth}
            height={svgHeight}
          >
            <defs>
              <linearGradient id="link-grad-gateway" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="link-grad-ep" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="link-grad-source" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
              </linearGradient>

              {/* Animated particle filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {links.map((link, idx) => {
              const dx = (link.endX - link.startX) * 0.5;
              const pathD = `M ${link.startX} ${link.startY} C ${link.startX + dx} ${link.startY}, ${link.endX - dx} ${link.endY}, ${link.endX} ${link.endY}`;
              const isHighlighted =
                hoveredNodeId === link.fromId ||
                hoveredNodeId === link.toId ||
                (selectedEndpoint && link.fromId.includes(selectedEndpoint.id)) ||
                (selectedEndpoint && link.toId.includes(selectedEndpoint.id));

              return (
                <g key={idx}>
                  {/* Background shadow path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="3"
                  />

                  {/* Flow curve link */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={link.color}
                    strokeWidth={isHighlighted ? '2.5' : '1.5'}
                    strokeDasharray={isHighlighted ? 'none' : '4 4'}
                    opacity={isHighlighted ? 0.95 : 0.5}
                    className="transition-all duration-300"
                  />

                  {/* Flow particle animation dot */}
                  <circle r={isHighlighted ? '3.5' : '2.5'} fill={link.color} filter="url(#glow)">
                    <animateMotion
                      path={pathD}
                      dur={`${3 + (idx % 3)}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* HTML Nodes Layer */}
          {nodes.map(node => {
            const isSelected = node.endpointData && selectedEndpoint?.id === node.endpointData.id;
            const isHovered = hoveredNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => {
                  if (node.endpointData) {
                    setSelectedEndpoint(node.endpointData);
                  }
                }}
                style={{
                  position: 'absolute',
                  left: node.x,
                  top: node.y,
                  width: node.width,
                  height: node.height,
                }}
                className={`rounded-xl border transition-all duration-200 flex items-center px-3 gap-2.5 cursor-pointer backdrop-blur-md shadow-md ${
                  node.type === 'gateway'
                    ? 'bg-slate-900/90 border-indigo-500/60 text-white ring-1 ring-indigo-500/30'
                    : node.type === 'group'
                    ? 'bg-slate-900/80 border-purple-500/40 text-purple-200'
                    : node.type === 'endpoint'
                    ? isSelected
                      ? 'bg-indigo-950/90 border-emerald-400 text-white ring-2 ring-emerald-500/40 shadow-lg'
                      : isHovered
                      ? 'bg-slate-900 border-indigo-400/80 text-white'
                      : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:border-slate-700'
                    : 'bg-slate-950/90 border-amber-600/40 text-amber-200'
                }`}
              >
                {/* Node Icon */}
                <div className="shrink-0">
                  {node.type === 'gateway' ? (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Server className="w-4 h-4" />
                    </div>
                  ) : node.type === 'group' ? (
                    <div className="w-7 h-7 rounded bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                  ) : node.type === 'endpoint' ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-900/80">
                      GET
                    </span>
                  ) : (
                    <div className="w-7 h-7 rounded bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Node Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate text-white">
                    {node.title}
                  </div>
                  {node.subtitle && (
                    <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      {node.subtitle}
                    </div>
                  )}
                </div>

                {/* Status indicator dot */}
                {node.type === 'endpoint' && (
                  <div className="shrink-0 flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Endpoint Inspector Drawer / Details */}
      {selectedEndpoint && (
        <div className="px-5 py-4 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-emerald-400 shrink-0">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  {selectedEndpoint.path}
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-emerald-400 font-mono">
                  {selectedEndpoint.statusCode} OK
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-300 font-mono">
                  Độ trễ: {selectedEndpoint.latencyMs}ms
                </span>
              </div>

              <p className="text-xs text-slate-400 mt-1">
                {selectedEndpoint.description || selectedEndpoint.name}
                {selectedEndpoint.sourceType === 'github_raw' && selectedEndpoint.githubRepo && (
                  <span className="text-indigo-400 ml-2 font-mono">
                    (Nguồn GitHub: {selectedEndpoint.githubRepo}/{selectedEndpoint.githubFilePath})
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => onTestInPlayground(selectedEndpoint.path, selectedEndpoint.method)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Thử Nghiệm Trong Playground</span>
          </button>
        </div>
      )}
    </div>
  );
};
