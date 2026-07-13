import http from 'node:http';
import fs from 'node:fs';

function loadDotEnv() {
  if (!fs.existsSync('.env')) return;

  const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadDotEnv();

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.NEXON_API_KEY;
const NEXON_BASE_URL = 'https://open.api.nexon.com';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': process.env.CORS_ORIGIN || '*',
    'access-control-allow-methods': 'GET,OPTIONS',
    'access-control-allow-headers': 'content-type'
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': process.env.CORS_ORIGIN || '*',
      'access-control-allow-methods': 'GET,OPTIONS',
      'access-control-allow-headers': 'content-type'
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: { message: 'GET 요청만 지원합니다.' } });
    return;
  }

  if (!API_KEY) {
    sendJson(res, 500, { error: { message: 'NEXON_API_KEY 환경 변수가 설정되지 않았습니다.' } });
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  if (!requestUrl.pathname.startsWith('/maplestory/v1/')) {
    sendJson(res, 404, { error: { message: '지원하지 않는 프록시 경로입니다.' } });
    return;
  }

  const upstreamUrl = new URL(`${NEXON_BASE_URL}${requestUrl.pathname}`);
  upstreamUrl.search = requestUrl.search;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-nxopen-api-key': API_KEY
      }
    });
    const body = await upstream.text();

    res.writeHead(upstream.status, {
      'content-type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
      'access-control-allow-origin': process.env.CORS_ORIGIN || '*'
    });
    res.end(body);
  } catch (error) {
    sendJson(res, 502, { error: { message: `넥슨 API 프록시 요청 실패: ${error.message}` } });
  }
});

server.listen(PORT, () => {
  console.log(`Nexon API proxy listening on http://localhost:${PORT}`);
});
