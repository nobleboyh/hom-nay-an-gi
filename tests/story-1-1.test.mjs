import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequestListener } from '../backend/src/express-api.mjs';

const requiredRootFiles = [
  '.env.template',
  'docker-compose.yml',
  'README.md',
  'nginx/nginx.conf',
  'backend/package.json',
  'backend/Dockerfile',
  'backend/src/express-api.mjs',
  'backend/src/llm-proxy.mjs',
  'backend/src/cron-worker.mjs',
  'frontend/.gitkeep',
];

test('story 1.1 scaffold files exist', () => {
  for (const file of requiredRootFiles) {
    assert.equal(existsSync(file), true, `Expected ${file} to exist`);
  }
});

test('.env.template documents required environment variables', () => {
  const envTemplate = readFileSync('.env.template', 'utf8');
  for (const key of [
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'LLM_PROVIDER',
    'LLM_API_KEY',
    'HERE_API_KEY',
    'MONGO_URI',
    'REDIS_URI',
  ]) {
    assert.match(envTemplate, new RegExp(`^${key}=`, 'm'), `Missing ${key}`);
  }
});

test('docker-compose.yml defines the required topology and safety constraints', () => {
  const compose = readFileSync('docker-compose.yml', 'utf8');

  for (const serviceName of [
    'nginx:',
    'express-api:',
    'llm-proxy:',
    'mongo:',
    'redis:',
    'cron-worker:',
  ]) {
    assert.match(compose, new RegExp(`^\\s{2}${serviceName}`, 'm'));
  }

  assert.match(compose, /mongo-data:/);
  assert.match(compose, /redis-data:/);
  assert.match(compose, /internal:/);
  assert.match(compose, /public:/);
  assert.match(compose, /express-api:[\s\S]*networks:[\s\S]*- public[\s\S]*- internal|express-api:[\s\S]*networks:[\s\S]*- internal[\s\S]*- public/);
  assert.doesNotMatch(compose, /27017:27017/);
  assert.match(compose, /mongo:[\s\S]*healthcheck:/);
  assert.match(compose, /redis:[\s\S]*healthcheck:/);
  assert.match(compose, /cron-worker:[\s\S]*profiles:\s*\n\s*-\s*full/);
  assert.match(compose, /8080:8080/);
});

test('nginx local development config proxies api traffic to express-api', () => {
  const nginxConfig = readFileSync('nginx/nginx.conf', 'utf8');
  assert.match(nginxConfig, /listen\s+8080;/);
  assert.match(nginxConfig, /location\s+\/api\/v1\//);
  assert.match(nginxConfig, /proxy_pass\s+http:\/\/express-api:3000/);
  assert.match(nginxConfig, /proxy_set_header\s+Host\s+\$host;/);
  assert.match(nginxConfig, /proxy_set_header\s+X-Forwarded-For\s+\$proxy_add_x_forwarded_for;/);
});

test('placeholder express-api serves the health endpoint expected by nginx', async () => {
  const requestListener = createRequestListener();
  const responseState = {
    statusCode: undefined,
    headers: undefined,
    body: '',
  };

  await new Promise((resolve) => {
    requestListener(
      {
        method: 'GET',
        url: '/api/v1/health',
      },
      {
        writeHead(statusCode, headers) {
          responseState.statusCode = statusCode;
          responseState.headers = headers;
        },
        end(body) {
          responseState.body = body;
          resolve();
        },
      },
    );
  });

  assert.equal(responseState.statusCode, 200);
  assert.deepEqual(responseState.headers, { 'content-type': 'application/json' });
  assert.deepEqual(JSON.parse(responseState.body), {
    success: true,
    data: {
      status: 'ok',
    },
  });
});
