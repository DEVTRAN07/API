export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type SourceType = 'static_json' | 'github_raw' | 'mock_generator';

export interface CustomEndpoint {
  id: string;
  name: string;
  path: string;
  method: HttpMethod;
  sourceType: SourceType;
  githubRepo?: string;
  githubFilePath?: string;
  githubBranch?: string;
  mockType?: 'users' | 'products' | 'posts' | 'metrics';
  mockCount?: number;
  statusCode: number;
  latencyMs: number;
  headers: Record<string, string>;
  responseBody: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitHubRepoInfo {
  fullName: string;
  owner: string;
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  license: string | null;
  topics: string[];
  homepage: string | null;
  contents?: Array<{
    name: string;
    path: string;
    type: 'file' | 'dir';
    size: number;
    download_url: string | null;
  }>;
  latestRelease?: {
    name: string;
    tag_name: string;
    published_at: string;
    html_url: string;
  } | null;
}

export interface GitHubPreset {
  repo: string;
  name: string;
  description: string;
  defaultFile: string;
  stars: string;
  tags: string[];
  category?: string;
}

export interface GitHubSearchResultItem {
  repo: string;
  name: string;
  description: string | null;
  stars: string;
  forks: number;
  language?: string | null;
  topics: string[];
  defaultBranch: string;
}

export interface ApiTestRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  params?: Record<string, string>;
  body?: string;
}

export interface ApiTestResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  durationMs: number;
  isJson: boolean;
  data: unknown;
  sizeBytes: number;
  error?: string;
}

export interface UserSession {
  isAdmin: boolean;
  username: string;
  token?: string;
}
