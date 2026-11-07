import { HttpMethod } from '../types';

export function generateCurlSnippet(
  url: string,
  method: HttpMethod,
  headers: Record<string, string>,
  body?: string
): string {
  let snippet = `curl -X ${method} "${url}"`;

  Object.entries(headers).forEach(([k, v]) => {
    if (k && v) {
      snippet += ` \\\n  -H "${k}: ${v}"`;
    }
  });

  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const escaped = body.replace(/"/g, '\\"');
    snippet += ` \\\n  -d "${escaped}"`;
  }

  return snippet;
}

export function generateFetchSnippet(
  url: string,
  method: HttpMethod,
  headers: Record<string, string>,
  body?: string
): string {
  const options: Record<string, unknown> = {
    method,
    headers,
  };

  if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      options.body = JSON.parse(body);
    } catch {
      options.body = body;
    }
  }

  return `// JavaScript / TypeScript (Fetch API)
async function callApi() {
  const response = await fetch("${url}", {
    method: "${method}",
    headers: ${JSON.stringify(headers, null, 6)},
${body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? `    body: JSON.stringify(${body.trim()}),\n` : ''}  });

  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }

  const data = await response.json();
  console.log("Response:", data);
  return data;
}

callApi().catch(console.error);`;
}

export function generatePythonSnippet(
  url: string,
  method: HttpMethod,
  headers: Record<string, string>,
  body?: string
): string {
  return `# Python 3 (requests)
import requests
import json

url = "${url}"
headers = ${JSON.stringify(headers, null, 4)}

${
  body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    ? `payload = ${body.trim()}
response = requests.${method.toLowerCase()}(url, headers=headers, json=payload)`
    : `response = requests.${method.toLowerCase()}(url, headers=headers)`
}

print(f"Status Code: {response.status_code}")
try:
    print(response.json())
except Exception:
    print(response.text)
`;
}

export function generateAxiosSnippet(
  url: string,
  method: HttpMethod,
  headers: Record<string, string>,
  body?: string
): string {
  return `// Node.js (Axios)
const axios = require('axios');

async function run() {
  try {
    const config = {
      method: '${method.toLowerCase()}',
      url: '${url}',
      headers: ${JSON.stringify(headers, null, 8)},
${body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? `      data: ${body.trim()},\n` : ''}    };

    const response = await axios(config);
    console.log(response.status, response.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
}

run();`;
}
