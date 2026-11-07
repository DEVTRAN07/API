import { CustomEndpoint, GitHubPreset, GitHubRepoInfo, GitHubSearchResultItem, ApiTestResponse, HttpMethod, UserSession } from '../types';

const TOKEN_KEY = 'gitapi_admin_token';

export const apiService = {
  // Token storage
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },

  clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },

  // Auth
  async login(username: string, password: string): Promise<UserSession> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đăng nhập quản trị viên thất bại');

    this.setToken(data.token);
    return {
      isAdmin: true,
      username: data.user.username,
      token: data.token,
    };
  },

  async checkAuth(): Promise<UserSession> {
    const token = this.getToken();
    if (!token) {
      return { isAdmin: false, username: 'Khách (Guest)' };
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.isAuthenticated) {
        return { isAdmin: true, username: data.user.username, token };
      }
    } catch {
      // fallback
    }

    this.clearToken();
    return { isAdmin: false, username: 'Khách (Guest)' };
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // ignore
      }
    }
    this.clearToken();
  },

  // Endpoints CRUD
  async getEndpoints(): Promise<CustomEndpoint[]> {
    const res = await fetch('/api/endpoints');
    if (!res.ok) throw new Error('Không thể tải danh sách endpoint');
    return res.json();
  },

  async saveEndpoint(endpoint: Partial<CustomEndpoint>): Promise<CustomEndpoint> {
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/endpoints', {
      method: 'POST',
      headers,
      body: JSON.stringify(endpoint),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu endpoint');
    return data.endpoint;
  },

  async deleteEndpoint(id: string): Promise<void> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/endpoints/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Lỗi khi xóa endpoint');
    }
  },

  // GitHub Inspection
  async inspectGitHubRepo(repo: string): Promise<GitHubRepoInfo> {
    const res = await fetch(`/api/github/inspect?repo=${encodeURIComponent(repo)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể kiểm tra repo GitHub');
    return data;
  },

  async getGitHubFile(repo: string, path: string, branch = 'main'): Promise<{
    repo: string;
    branch: string;
    path: string;
    isJson: boolean;
    data: unknown;
    rawText: string;
    sizeBytes: number;
    lineCount: number;
  }> {
    const res = await fetch(
      `/api/github/file?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}&branch=${encodeURIComponent(branch)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể đọc file từ GitHub');
    return data;
  },

  async getGitHubPresets(): Promise<GitHubPreset[]> {
    const res = await fetch('/api/github/presets');
    if (!res.ok) throw new Error('Không thể tải danh mục GitHub presets');
    return res.json();
  },

  async searchGitHubRepos(query: string): Promise<{ total: number; items: GitHubSearchResultItem[] }> {
    const res = await fetch(`/api/github/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi khi tìm kiếm repo trên GitHub');
    return data;
  },

  // Universal API Playground Request Executor
  async executeRequest(
    url: string,
    method: HttpMethod = 'GET',
    headers: Record<string, string> = {},
    body?: string
  ): Promise<ApiTestResponse> {
    const res = await fetch('/api/proxy/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, method, headers, body }),
    });
    return res.json();
  },
};
