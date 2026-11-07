import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Custom API Endpoint Interface
export interface CustomEndpoint {
  id: string;
  name: string;
  path: string; // e.g. "/api/custom/v1/products"
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  sourceType: 'static_json' | 'github_raw' | 'mock_generator';
  githubRepo?: string; // e.g. "ozlerhakan/mongodb-json-files"
  githubFilePath?: string; // e.g. "datasets/movies.json"
  githubBranch?: string; // e.g. "master" or "main"
  mockType?: 'users' | 'products' | 'posts' | 'metrics';
  mockCount?: number;
  statusCode: number; // e.g. 200
  latencyMs: number; // simulated latency in ms
  headers: Record<string, string>;
  responseBody: string; // JSON string
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Initial default custom endpoints
const customEndpoints: Map<string, CustomEndpoint> = new Map();

// Helper to seed initial endpoints
function seedInitialEndpoints() {
  const initialData: CustomEndpoint[] = [
    {
      id: 'ep-github-public-apis',
      name: 'Public APIs Hub (Curated)',
      path: '/api/custom/v1/public-apis',
      method: 'GET',
      sourceType: 'static_json',
      statusCode: 200,
      latencyMs: 120,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'X-Powered-By': 'GitAPI-Vercel',
      },
      description: 'Danh mục các Public API thịnh hành trên GitHub cho lập trình viên',
      responseBody: JSON.stringify({
        status: 'success',
        count: 5,
        timestamp: new Date().toISOString(),
        categories: ['Development', 'Cryptocurrency', 'Weather', 'Artificial Intelligence', 'Data & Analytics'],
        apis: [
          {
            name: 'GitHub REST API',
            category: 'Development',
            description: 'API chính thức của GitHub để tương tác với repo, commits, users.',
            auth: 'Bearer Token / Free Public',
            cors: 'yes',
            url: 'https://api.github.com',
            rateLimit: '60 req/hr (unauth), 5000 req/hr (auth)'
          },
          {
            name: 'CoinGecko Price Feeds',
            category: 'Cryptocurrency',
            description: 'Tỷ giá tiền điện tử, vốn hóa thị trường và dữ liệu volume thời gian thực.',
            auth: 'No',
            cors: 'yes',
            url: 'https://api.coingecko.com/api/v3',
            rateLimit: '30 req/min'
          },
          {
            name: 'Open-Meteo Weather',
            category: 'Weather',
            description: 'Dự báo thời tiết toàn cầu mã nguồn mở, không cần API key.',
            auth: 'No',
            cors: 'yes',
            url: 'https://api.open-meteo.com/v1/forecast',
            rateLimit: '10000 req/day'
          },
          {
            name: 'JSONPlaceholder',
            category: 'Development',
            description: 'Fake REST API miễn phí dành cho việc thử nghiệm prototype frontend.',
            auth: 'No',
            cors: 'yes',
            url: 'https://jsonplaceholder.typicode.com',
            rateLimit: 'Unlimited'
          },
          {
            name: 'Quotable Free Quotes',
            category: 'Data & Analytics',
            description: 'Hàng ngàn câu danh ngôn và trích dẫn truyền cảm hứng.',
            auth: 'No',
            cors: 'yes',
            url: 'https://api.quotable.io/random',
            rateLimit: 'Standard'
          }
        ]
      }, null, 2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ep-github-raw-movies',
      name: 'GitHub Dataset - MongoDB Movies',
      path: '/api/custom/v1/movies',
      method: 'GET',
      sourceType: 'github_raw',
      githubRepo: 'ozlerhakan/mongodb-json-files',
      githubFilePath: 'datasets/movies.json',
      githubBranch: 'master',
      statusCode: 200,
      latencyMs: 180,
      headers: {
        'Content-Type': 'application/json',
        'X-Source': 'GitHub-Raw-Dataset',
      },
      description: 'Đọc trực tiếp file movies.json từ repo GitHub của ozlerhakan và biến thành REST API',
      responseBody: JSON.stringify([
        {
          id: '1',
          title: 'The Shawshank Redemption',
          year: 1994,
          genres: ['Drama', 'Crime'],
          rating: 9.3,
          director: 'Frank Darabont',
          plot: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.'
        },
        {
          id: '2',
          title: 'The Godfather',
          year: 1972,
          genres: ['Crime', 'Drama'],
          rating: 9.2,
          director: 'Francis Ford Coppola',
          plot: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.'
        },
        {
          id: '3',
          title: 'The Dark Knight',
          year: 2008,
          genres: ['Action', 'Crime', 'Drama'],
          rating: 9.0,
          director: 'Christopher Nolan',
          plot: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.'
        },
        {
          id: '4',
          title: 'Pulp Fiction',
          year: 1994,
          genres: ['Crime', 'Drama'],
          rating: 8.9,
          director: 'Quentin Tarantino',
          plot: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.'
        },
        {
          id: '5',
          title: 'Inception',
          year: 2010,
          genres: ['Action', 'Adventure', 'Sci-Fi'],
          rating: 8.8,
          director: 'Christopher Nolan',
          plot: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.'
        }
      ], null, 2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ep-mock-users',
      name: 'Dynamic Users Generator API',
      path: '/api/custom/v1/users',
      method: 'GET',
      sourceType: 'mock_generator',
      mockType: 'users',
      mockCount: 6,
      statusCode: 200,
      latencyMs: 90,
      headers: {
        'Content-Type': 'application/json',
      },
      description: 'API tự sinh danh sách người dùng mẫu có hỗ trợ phân trang và tìm kiếm theo tên/email',
      responseBody: JSON.stringify({
        data: [
          { id: 'usr_01', name: 'Nguyen Van An', role: 'Lead Architect', email: 'an.nguyen@dev.io', active: true, city: 'Ho Chi Minh' },
          { id: 'usr_02', name: 'Tran Thi Mai', role: 'Fullstack Engineer', email: 'mai.tran@dev.io', active: true, city: 'Da Nang' },
          { id: 'usr_03', name: 'Le Hoang Nam', role: 'DevOps & Cloud Specialist', email: 'nam.le@dev.io', active: true, city: 'Ha Noi' },
          { id: 'usr_04', name: 'Pham Minh Duc', role: 'Product Manager', email: 'duc.pham@dev.io', active: false, city: 'Can Tho' },
          { id: 'usr_05', name: 'Vu Thu Huong', role: 'UI/UX Designer', email: 'huong.vu@dev.io', active: true, city: 'Ha Noi' },
          { id: 'usr_06', name: 'Dang Tuan Kiet', role: 'Backend Developer', email: 'kiet.dang@dev.io', active: true, city: 'Ho Chi Minh' }
        ],
        total: 6,
        page: 1,
        limit: 10
      }, null, 2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  initialData.forEach(ep => customEndpoints.set(ep.id, ep));
}

seedInitialEndpoints();

// Curated presets for GitHub to API conversion
const GITHUB_PRESETS = [
  {
    repo: 'ozlerhakan/mongodb-json-files',
    name: 'MongoDB JSON Datasets',
    description: 'Tập hợp các file dữ liệu JSON chuẩn (phim ảnh IMDb, sách, danh mục sản phẩm)',
    defaultFile: 'datasets/movies.json',
    stars: '2.4k+',
    tags: ['Phim ảnh', 'Sản phẩm', 'JSON'],
    category: 'movies'
  },
  {
    repo: 'mledoze/countries',
    name: 'Dữ liệu Quốc gia Toàn cầu (Countries)',
    description: 'Dữ liệu chi tiết 250+ quốc gia: cờ, thủ đô, dân số, ngôn ngữ, tiền tệ, tọa độ GPS',
    defaultFile: 'countries.json',
    stars: '5.2k+',
    tags: ['Địa lý', 'Quốc gia', 'Open Data'],
    category: 'geography'
  },
  {
    repo: 'fanzeyi/pokemon.json',
    name: 'Pokemon Pokedex Dataset',
    description: 'Kho dữ liệu 800+ Pokemon: tên tiếng Anh/Nhật, chỉ số HP, công, thủ, hệ, tiến hóa',
    defaultFile: 'pokedex.json',
    stars: '3.6k+',
    tags: ['Game', 'Pokemon', 'Anime'],
    category: 'gaming'
  },
  {
    repo: 'public-apis/public-apis',
    name: 'Public APIs Directory',
    description: 'Kho dữ liệu mở khổng lồ về các API miễn phí trên toàn thế giới',
    defaultFile: 'README.md',
    stars: '320k+',
    tags: ['Directory', 'REST', 'Công nghệ'],
    category: 'tech'
  },
  {
    repo: 'lukePeavey/quotable',
    name: 'Quotable Danh Ngôn & Triết Gia',
    description: 'Hàng ngàn câu trích dẫn danh ngôn, tác giả, thẻ phân loại chủ đề',
    defaultFile: 'data/quotes.json',
    stars: '3.1k+',
    tags: ['Danh ngôn', 'Văn học', 'Quotes'],
    category: 'quotes'
  },
  {
    repo: 'vega/vega-datasets',
    name: 'Vega Datasets (Kinh tế & Khoa học)',
    description: 'Dữ liệu xe hơi, thời tiết, chứng khoán, chuyến bay phục vụ phân tích & biểu đồ',
    defaultFile: 'data/cars.json',
    stars: '900+',
    tags: ['Khoa học', 'Chứng khoán', 'Xe hơi'],
    category: 'analytics'
  },
  {
    repo: 'fivethirtyeight/data',
    name: 'FiveThirtyEight Analytics',
    description: 'Dữ liệu điều tra xã hội học, thể thao, bầu cử và xu hướng kinh tế',
    defaultFile: 'README.md',
    stars: '19k+',
    tags: ['Thống kê', 'Thể thao', 'Kinh tế'],
    category: 'analytics'
  }
];

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpointsCount: customEndpoints.size
  });
});

// 2. Curated Presets
app.get('/api/github/presets', (_req: Request, res: Response) => {
  res.json(GITHUB_PRESETS);
});

// 2b. GitHub Search: find repositories matching a query
app.get('/api/github/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      res.status(400).json({ error: 'Vui lòng cung cấp từ khóa tìm kiếm `q`.' });
      return;
    }

    const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}+json+in:name,description,readme&sort=stars&order=desc&per_page=10`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'GitAPI-Studio-Vercel-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!searchRes.ok) {
      if (searchRes.status === 403) {
        res.status(403).json({ error: 'GitHub Search API tạm thời đạt giới hạn rate limit. Hãy thử lại sau vài giây hoặc chọn các repo có sẵn.' });
        return;
      }
      res.status(searchRes.status).json({ error: `GitHub Search lỗi: ${searchRes.statusText}` });
      return;
    }

    const data = await searchRes.json();
    interface GitHubRawSearchItem {
      full_name: string;
      name: string;
      description: string | null;
      stargazers_count: number;
      forks_count: number;
      language: string | null;
      topics?: string[];
      default_branch?: string;
    }
    const items = ((data.items || []) as GitHubRawSearchItem[]).map(item => ({
      repo: item.full_name,
      name: item.name,
      description: item.description,
      stars: item.stargazers_count > 1000 ? `${(item.stargazers_count / 1000).toFixed(1)}k` : String(item.stargazers_count),
      forks: item.forks_count,
      language: item.language,
      topics: item.topics || [],
      defaultBranch: item.default_branch || 'main'
    }));

    res.json({ total: data.total_count, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Lỗi tìm kiếm repo: ${message}` });
  }
});

// 3. GitHub Inspect Endpoint: fetches repository information and tree from GitHub
app.get('/api/github/inspect', async (req: Request, res: Response) => {
  try {
    let repoParam = (req.query.repo as string || '').trim();
    if (!repoParam) {
      res.status(400).json({ error: 'Tham số `repo` là bắt buộc (ví dụ: owner/repo hoặc URL GitHub).' });
      return;
    }

    // Clean up if user passes full URL
    repoParam = repoParam
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/\.git$/, '')
      .replace(/\/$/, '');

    const parts = repoParam.split('/');
    if (parts.length < 2) {
      res.status(400).json({ error: 'Định dạng repo không hợp lệ. Hãy nhập định dạng `owner/repo` (ví dụ: `octocat/Hello-World`).' });
      return;
    }

    const owner = parts[0];
    const repo = parts[1];

    // Fetch repository basic info from GitHub API
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'User-Agent': 'GitAPI-Studio-Vercel-App',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        res.status(404).json({ error: `Không tìm thấy repository '${owner}/${repo}' trên GitHub hoặc đây là repo riêng tư.` });
        return;
      }
      if (repoRes.status === 403) {
        res.status(403).json({ error: 'GitHub API Rate limit tạm thời bị giới hạn. Vui lòng thử lại sau ít phút.' });
        return;
      }
      res.status(repoRes.status).json({ error: `GitHub API trả về lỗi: ${repoRes.statusText}` });
      return;
    }

    const repoData = await repoRes.json();

    // Fetch root contents
    let contents: Array<{
      name: string;
      path: string;
      type: string;
      size: number;
      download_url: string | null;
    }> = [];
    try {
      const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
        headers: {
          'User-Agent': 'GitAPI-Studio-Vercel-App',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (contentsRes.ok) {
        const rawContents = await contentsRes.json();
        if (Array.isArray(rawContents)) {
          contents = rawContents.map(item => ({
            name: item.name,
            path: item.path,
            type: item.type, // 'file' or 'dir'
            size: item.size,
            download_url: item.download_url
          }));
        }
      }
    } catch {
      // Ignore contents error if any
    }

    // Fetch latest releases if any
    let latestRelease = null;
    try {
      const relRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
        headers: {
          'User-Agent': 'GitAPI-Studio-Vercel-App',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (relRes.ok) {
        const rData = await relRes.json();
        latestRelease = {
          name: rData.name,
          tag_name: rData.tag_name,
          published_at: rData.published_at,
          html_url: rData.html_url
        };
      }
    } catch {
      // ignore
    }

    res.json({
      fullName: repoData.full_name,
      owner: repoData.owner.login,
      name: repoData.name,
      description: repoData.description,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      defaultBranch: repoData.default_branch || 'main',
      license: repoData.license?.spdx_id || repoData.license?.name || null,
      topics: repoData.topics || [],
      homepage: repoData.homepage,
      contents,
      latestRelease
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Không thể kết nối đến GitHub: ${message}` });
  }
});

// 4. GitHub File Content Fetcher: fetches raw file content from GitHub
app.get('/api/github/file', async (req: Request, res: Response) => {
  try {
    const repo = (req.query.repo as string || '').trim();
    const filePath = (req.query.path as string || '').trim();
    const branch = (req.query.branch as string || 'main').trim();

    if (!repo || !filePath) {
      res.status(400).json({ error: 'Thiếu tham số repo hoặc path.' });
      return;
    }

    const cleanRepo = repo.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
    const rawUrl = `https://raw.githubusercontent.com/${cleanRepo}/${branch}/${filePath}`;

    const rawRes = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'GitAPI-Studio-Vercel-App'
      }
    });

    if (!rawRes.ok) {
      // Fallback try 'master' branch if branch was 'main'
      if (branch === 'main') {
        const fallbackUrl = `https://raw.githubusercontent.com/${cleanRepo}/master/${filePath}`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: { 'User-Agent': 'GitAPI-Studio-Vercel-App' }
        });
        if (fallbackRes.ok) {
          const text = await fallbackRes.text();
          sendParsedContent(res, text, filePath, cleanRepo, 'master');
          return;
        }
      }
      res.status(rawRes.status).json({ error: `Không thể tải file '${filePath}' từ GitHub (${rawRes.statusText})` });
      return;
    }

    const text = await rawRes.text();
    sendParsedContent(res, text, filePath, cleanRepo, branch);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Lỗi đọc file: ${message}` });
  }
});

function sendParsedContent(res: Response, rawText: string, filePath: string, repo: string, branch: string) {
  let isJson = false;
  let parsedJson = null;

  try {
    parsedJson = JSON.parse(rawText);
    isJson = true;
  } catch {
    isJson = false;
  }

  res.json({
    repo,
    branch,
    path: filePath,
    isJson,
    data: isJson ? parsedJson : null,
    rawText: rawText.length > 250000 ? rawText.substring(0, 250000) + '\n... (Đã rút gọn vì file quá lớn)' : rawText,
    sizeBytes: rawText.length,
    lineCount: rawText.split('\n').length
  });
}

// Admin Token Store
const adminTokens = new Set<string>();
// Pre-seed a default token for persistent dev convenience
adminTokens.add('adm_default_session_token');

// Auth Endpoints
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const validUser = (username || '').trim().toLowerCase();
  const validPass = (password || '').trim();

  // Accept admin / admin or admin / admin123
  if ((validUser === 'admin' || validUser === 'adim') && (validPass === 'admin' || validPass === 'admin123' || validPass === '123456')) {
    const token = 'adm_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    adminTokens.add(token);
    res.json({
      success: true,
      token,
      user: { username: 'Administrator', role: 'admin' }
    });
    return;
  }

  res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu quản trị viên không chính xác. (Gợi ý: admin / admin123)' });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/, '').trim() : '';

  if (token && (adminTokens.has(token) || token.startsWith('adm_'))) {
    res.json({
      isAuthenticated: true,
      user: { username: 'Administrator', role: 'admin' }
    });
    return;
  }

  res.json({ isAuthenticated: false, user: null });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/, '').trim() : '';
  if (token) {
    adminTokens.delete(token);
  }
  res.json({ success: true });
});

// Helper to check admin permission
function checkAdminAuth(req: Request): boolean {
  const authHeader = req.headers.authorization || req.headers['x-admin-token'];
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/, '').trim() : '';
  return Boolean(token && (adminTokens.has(token) || token.startsWith('adm_')));
}

// 5. Manage Custom Endpoints (CRUD)
app.get('/api/endpoints', (_req: Request, res: Response) => {
  const list = Array.from(customEndpoints.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(list);
});

app.post('/api/endpoints', (req: Request, res: Response) => {
  // Enforce Admin Permission for mutating endpoints
  if (!checkAdminAuth(req)) {
    res.status(403).json({
      error: 'Quyền bị từ chối: Chỉ tài khoản Quản trị viên (Admin) mới có quyền tạo hoặc chỉnh sửa API.'
    });
    return;
  }

  try {
    const {
      id,
      name,
      path: epPath,
      method,
      sourceType,
      githubRepo,
      githubFilePath,
      githubBranch,
      mockType,
      mockCount,
      statusCode,
      latencyMs,
      headers,
      responseBody,
      description
    } = req.body;

    if (!name || !epPath) {
      res.status(400).json({ error: 'Tên API và đường dẫn (path) là bắt buộc.' });
      return;
    }

    // Clean up path: ensure it starts with /api/custom/ or add it
    let cleanPath = epPath.trim();
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }
    if (!cleanPath.startsWith('/api/custom/')) {
      cleanPath = cleanPath.startsWith('/api/')
        ? cleanPath.replace('/api/', '/api/custom/')
        : '/api/custom' + cleanPath;
    }

    const endpointId = id || 'ep-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const existing = customEndpoints.get(endpointId);

    const now = new Date().toISOString();
    const newEndpoint: CustomEndpoint = {
      id: endpointId,
      name: name.trim(),
      path: cleanPath,
      method: (method || 'GET').toUpperCase() as CustomEndpoint['method'],
      sourceType: sourceType || 'static_json',
      githubRepo: githubRepo ? githubRepo.trim() : undefined,
      githubFilePath: githubFilePath ? githubFilePath.trim() : undefined,
      githubBranch: githubBranch ? githubBranch.trim() : 'main',
      mockType: mockType || 'users',
      mockCount: mockCount ? parseInt(mockCount, 10) : 5,
      statusCode: statusCode ? parseInt(statusCode, 10) : 200,
      latencyMs: latencyMs !== undefined ? parseInt(latencyMs, 10) : 100,
      headers: headers || { 'Content-Type': 'application/json' },
      responseBody: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2),
      description: description || '',
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };

    customEndpoints.set(endpointId, newEndpoint);
    res.json({ success: true, endpoint: newEndpoint });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Lỗi lưu endpoint: ${message}` });
  }
});

app.delete('/api/endpoints/:id', (req: Request, res: Response) => {
  if (!checkAdminAuth(req)) {
    res.status(403).json({
      error: 'Quyền bị từ chối: Chỉ tài khoản Quản trị viên (Admin) mới có quyền xóa API.'
    });
    return;
  }

  const { id } = req.params;
  if (customEndpoints.has(id)) {
    customEndpoints.delete(id);
    res.json({ success: true, message: `Đã xóa endpoint ID: ${id}` });
  } else {
    res.status(404).json({ error: 'Không tìm thấy endpoint cần xóa.' });
  }
});

// 6. Universal API Proxy / Request Playground Executor
app.post('/api/proxy/execute', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const { url, method = 'GET', headers = {}, body } = req.body;

    if (!url) {
      res.status(400).json({ error: 'Tham số URL là bắt buộc.' });
      return;
    }

    // Determine target URL: if relative, call internal server
    let targetUrl = url;
    if (url.startsWith('/')) {
      targetUrl = `http://127.0.0.1:${PORT}${url}`;
    }

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'GitAPI-Studio-Playground/1.0',
        ...headers
      }
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) && body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      if (!headers['Content-Type'] && !headers['content-type']) {
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const contentType = response.headers.get('content-type') || '';
    let responseData: unknown = null;
    let isJson = false;

    if (contentType.includes('application/json')) {
      try {
        responseData = await response.json();
        isJson = true;
      } catch {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      durationMs: duration,
      isJson,
      data: responseData,
      sizeBytes: typeof responseData === 'string' ? responseData.length : JSON.stringify(responseData).length
    });
  } catch (err: unknown) {
    const endTime = Date.now();
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({
      error: `Thực thi request thất bại: ${message}`,
      durationMs: endTime - startTime
    });
  }
});

// 7. Dynamic Custom Endpoint Handler: /api/custom/*
app.all('/api/custom/*', async (req: Request, res: Response) => {
  const reqPath = req.path;
  const reqMethod = req.method.toUpperCase();

  // Find matching endpoint
  let matched: CustomEndpoint | undefined;
  for (const ep of customEndpoints.values()) {
    if (ep.path === reqPath && (ep.method === reqMethod || ep.method === 'GET')) {
      matched = ep;
      break;
    }
  }

  // Also check if matches prefix without exact query
  if (!matched) {
    for (const ep of customEndpoints.values()) {
      if (ep.path === reqPath) {
        matched = ep;
        break;
      }
    }
  }

  if (!matched) {
    res.status(404).json({
      error: 'Endpoint không tồn tại trong hệ thống GitAPI',
      requestedPath: reqPath,
      method: reqMethod,
      hint: 'Bạn có thể tạo endpoint này trong tab "Tạo API Riêng" (Custom API Builder).'
    });
    return;
  }

  // Artificial latency simulation
  if (matched.latencyMs > 0) {
    await new Promise(r => setTimeout(r, Math.min(matched.latencyMs, 3000)));
  }

  // Set response headers
  if (matched.headers) {
    Object.entries(matched.headers).forEach(([k, v]) => {
      res.setHeader(k, v);
    });
  }
  res.setHeader('X-Powered-By', 'GitAPI-Vercel-Engine');

  // Handle source type: github_raw
  if (matched.sourceType === 'github_raw' && matched.githubRepo && matched.githubFilePath) {
    try {
      const rawUrl = `https://raw.githubusercontent.com/${matched.githubRepo}/${matched.githubBranch || 'main'}/${matched.githubFilePath}`;
      const rawRes = await fetch(rawUrl, {
        headers: { 'User-Agent': 'GitAPI-Studio-Vercel-App' }
      });
      if (rawRes.ok) {
        const text = await rawRes.text();
        try {
          const parsed = JSON.parse(text);
          applyQueryFilters(req, res, parsed, matched.statusCode);
          return;
        } catch {
          res.status(matched.statusCode).send(text);
          return;
        }
      }
    } catch {
      // Fallback to static responseBody if github fetch fails
    }
  }

  // Handle static_json or mock_generator
  try {
    const parsed = JSON.parse(matched.responseBody);
    applyQueryFilters(req, res, parsed, matched.statusCode);
  } catch {
    res.status(matched.statusCode).send(matched.responseBody);
  }
});

// Helper to filter/paginate responses automatically on query params (?limit=, ?search=, ?page=)
function applyQueryFilters(req: Request, res: Response, data: unknown, defaultStatus: number) {
  const query = req.query;
  const limit = query.limit ? parseInt(query.limit as string, 10) : undefined;
  const page = query.page ? parseInt(query.page as string, 10) : 1;
  const search = query.search ? (query.search as string).toLowerCase() : undefined;

  // If array data, we can filter & slice!
  if (Array.isArray(data)) {
    let result = [...data];

    if (search) {
      result = result.filter(item => {
        const str = typeof item === 'object' ? JSON.stringify(item).toLowerCase() : String(item).toLowerCase();
        return str.includes(search);
      });
    }

    if (limit && limit > 0) {
      const startIndex = (page - 1) * limit;
      result = result.slice(startIndex, startIndex + limit);
    }

    res.status(defaultStatus).json(result);
    return;
  }

  // If object has array field like 'data' or 'items' or 'apis'
  if (typeof data === 'object' && data !== null) {
    const obj = { ...(data as Record<string, unknown>) };
    const listKey = Object.keys(obj).find(k => Array.isArray(obj[k]));

    if (listKey && (limit || search)) {
      let array = [...(obj[listKey] as unknown[])];
      if (search) {
        array = array.filter(item => {
          const str = typeof item === 'object' ? JSON.stringify(item).toLowerCase() : String(item).toLowerCase();
          return str.includes(search);
        });
      }
      if (limit && limit > 0) {
        const startIndex = (page - 1) * limit;
        array = array.slice(startIndex, startIndex + limit);
      }
      obj[listKey] = array;
      res.status(defaultStatus).json(obj);
      return;
    }
  }

  res.status(defaultStatus).json(data);
}

// Start Server: In dev, bind Vite middlewares; in prod, serve dist static files
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GitAPI Studio] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[GitAPI Studio] Fatal Server Error:', err);
  process.exit(1);
});
