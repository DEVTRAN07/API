import JSZip from 'jszip';
import { CustomEndpoint } from '../types';

export interface VercelPackageFiles {
  'vercel.json': string;
  'api/[...path].ts': string;
  'endpoints.json': string;
  'package.json': string;
  'tsconfig.json': string;
  'README.md': string;
  '.gitignore': string;
}

export function generateVercelFiles(endpoints: CustomEndpoint[]): VercelPackageFiles {
  const endpointsJson = JSON.stringify(endpoints, null, 2);

  const vercelJson = JSON.stringify(
    {
      version: 2,
      name: "gitapi-vercel-serverless",
      routes: [
        {
          src: "/api/custom/(.*)",
          dest: "/api/[...path]"
        },
        {
          src: "/api/(.*)",
          dest: "/api/[...path]"
        }
      ],
      headers: [
        {
          source: "/api/(.*)",
          headers: [
            { key: "Access-Control-Allow-Credentials", value: "true" },
            { key: "Access-Control-Allow-Origin", value: "*" },
            { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
            {
              key: "Access-Control-Allow-Headers",
              value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
            }
          ]
        }
      ]
    },
    null,
    2
  );

  const apiHandlerTs = `// Vercel Serverless Function Handler
// File: api/[...path].ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import endpointsData from '../endpoints.json';

interface CustomEndpoint {
  id: string;
  name: string;
  path: string;
  method: string;
  sourceType: string;
  githubRepo?: string;
  githubFilePath?: string;
  githubBranch?: string;
  statusCode: number;
  latencyMs: number;
  headers: Record<string, string>;
  responseBody: string;
}

const endpoints: CustomEndpoint[] = endpointsData as CustomEndpoint[];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const reqUrl = req.url || '';
  const parsedPath = reqUrl.split('?')[0];
  const method = (req.method || 'GET').toUpperCase();

  // Find matching endpoint
  let matched = endpoints.find(
    ep => ep.path === parsedPath && (ep.method === method || ep.method === 'GET')
  );

  if (!matched) {
    // Try matching without /api/custom prefix if user called /api/something
    matched = endpoints.find(ep => {
      const epClean = ep.path.replace('/api/custom', '/api');
      const reqClean = parsedPath.replace('/api/custom', '/api');
      return epClean === reqClean;
    });
  }

  if (!matched) {
    return res.status(404).json({
      error: 'Endpoint not found on this Vercel Serverless deployment',
      requestedPath: parsedPath,
      method: method,
      availableEndpoints: endpoints.map(e => ({ name: e.name, path: e.path, method: e.method }))
    });
  }

  // Artificial latency simulation
  if (matched.latencyMs > 0) {
    await new Promise(r => setTimeout(r, Math.min(matched.latencyMs, 2000)));
  }

  // Set response headers
  if (matched.headers) {
    Object.entries(matched.headers).forEach(([k, v]) => {
      res.setHeader(k, v);
    });
  }
  res.setHeader('X-Powered-By', 'GitAPI-Vercel-Serverless');

  // If source is GitHub Raw, fetch live
  if (matched.sourceType === 'github_raw' && matched.githubRepo && matched.githubFilePath) {
    try {
      const branch = matched.githubBranch || 'main';
      const rawUrl = \`https://raw.githubusercontent.com/\${matched.githubRepo}/\${branch}/\${matched.githubFilePath}\`;
      const ghRes = await fetch(rawUrl, {
        headers: { 'User-Agent': 'GitAPI-Vercel-Deployment' }
      });
      if (ghRes.ok) {
        const text = await ghRes.text();
        try {
          const parsed = JSON.parse(text);
          return applyFilters(req, res, parsed, matched.statusCode);
        } catch {
          return res.status(matched.statusCode).send(text);
        }
      }
    } catch {
      // Fallback to static body
    }
  }

  try {
    const parsed = JSON.parse(matched.responseBody);
    return applyFilters(req, res, parsed, matched.statusCode);
  } catch {
    return res.status(matched.statusCode).send(matched.responseBody);
  }
}

function applyFilters(req: VercelRequest, res: VercelResponse, data: any, defaultStatus: number) {
  const query = req.query || {};
  const limit = query.limit ? parseInt(query.limit as string, 10) : undefined;
  const page = query.page ? parseInt(query.page as string, 10) : 1;
  const search = query.search ? (query.search as string).toLowerCase() : undefined;

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
    return res.status(defaultStatus).json(result);
  }

  return res.status(defaultStatus).json(data);
}
`;

  const packageJson = JSON.stringify(
    {
      name: "gitapi-vercel-serverless",
      version: "1.0.0",
      description: "Custom REST APIs generated via GitAPI Studio, deployed on Vercel Serverless Functions",
      main: "api/[...path].ts",
      scripts: {
        dev: "vercel dev",
        deploy: "vercel deploy --prod"
      },
      dependencies: {
        "@vercel/node": "^3.2.14"
      },
      devDependencies: {
        typescript: "^5.4.0",
        "@types/node": "^20.11.0"
      }
    },
    null,
    2
  );

  const tsconfigJson = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "CommonJS",
        moduleResolution: "node",
        esModuleInterop: true,
        resolveJsonModule: true,
        strict: true,
        skipLibCheck: true
      },
      include: ["api/**/*"]
    },
    null,
    2
  );

  const gitignore = `node_modules
.vercel
dist
.env
.env.local
.DS_Store
`;

  const readmeMd = `# 🚀 GitAPI Serverless Deployment on Vercel

Dự án này chứa các API REST tùy chỉnh được xuất từ **GitAPI Studio**, sẵn sàng triển khai ngay lập tức lên **Vercel** miễn phí 100%!

## 📦 Danh sách API Đã Cấu Hình:
${endpoints.map(e => `- **${e.method}** \`${e.path}\` : ${e.name}`).join('\n')}

---

## ⚡ Cách Triển Khai Lên Vercel (2 Cách)

### Cách 1: Sử dụng Vercel CLI (Nhanh nhất - 30 giây)
1. Cài đặt Vercel CLI nếu chưa có:
\`\`\`bash
npm install -g vercel
\`\`\`

2. Mở thư mục này trong Terminal và chạy lệnh:
\`\`\`bash
vercel
\`\`\`
*(Nhấn Enter theo các câu hỏi mặc định của Vercel)*

3. Triển khai bản Production:
\`\`\`bash
vercel --prod
\`\`\`

### Cách 2: Đưa lên GitHub rồi Import vào Vercel Dashboard
1. Tạo một repository mới trên GitHub (ví dụ: \`my-gitapi-vercel\`).
2. Khởi tạo Git và push mã nguồn này lên:
\`\`\`bash
git init
git add .
git commit -m "Initial GitAPI Serverless commit"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
\`\`\`
3. Truy cập [vercel.com/dashboard](https://vercel.com/dashboard), nhấn **Add New Project** -> Chọn repository vừa push -> Nhấn **Deploy**.
4. Vercel sẽ tự động phát hiện các Serverless Functions trong thư mục \`api/\` và cấp cho bạn một domain HTTPS miễn phí (ví dụ: \`https://my-gitapi.vercel.app\`).

---

## 🧪 Cách Thử Nghiệm API Sau Khi Deploy
Ví dụ domain của bạn là \`https://my-gitapi.vercel.app\`:
- \`GET https://my-gitapi.vercel.app/api/custom/v1/public-apis\`
- \`GET https://my-gitapi.vercel.app/api/custom/v1/movies?limit=2\`
- \`GET https://my-gitapi.vercel.app/api/custom/v1/users?search=Nguyen\`

Chúc bạn phát triển ứng dụng thành công!
`;

  return {
    'vercel.json': vercelJson,
    'api/[...path].ts': apiHandlerTs,
    'endpoints.json': endpointsJson,
    'package.json': packageJson,
    'tsconfig.json': tsconfigJson,
    'README.md': readmeMd,
    '.gitignore': gitignore,
  };
}

export async function downloadVercelZip(endpoints: CustomEndpoint[]): Promise<void> {
  const files = generateVercelFiles(endpoints);
  const zip = new JSZip();

  zip.file('vercel.json', files['vercel.json']);
  zip.file('endpoints.json', files['endpoints.json']);
  zip.file('package.json', files['package.json']);
  zip.file('tsconfig.json', files['tsconfig.json']);
  zip.file('README.md', files['README.md']);
  zip.file('.gitignore', files['.gitignore']);

  // create api folder
  const apiFolder = zip.folder('api');
  if (apiFolder) {
    apiFolder.file('[...path].ts', files['api/[...path].ts']);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `gitapi-vercel-project-${Date.now().toString(36)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
