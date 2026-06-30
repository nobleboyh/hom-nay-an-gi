import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const requiredRootFiles = [
  '.env.template',
  'docker-compose.yml',
  'README.md',
  'nginx/nginx.conf',
  'backend/package.json',
  'backend/Dockerfile',
  'backend/apps/express-api/src/index.ts',
  'backend/apps/express-api/src/server.ts',
  'backend/apps/llm-proxy/src/index.ts',
  'backend/apps/cron-worker/src/index.ts',
  'frontend/package.json',
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
    'HERE_API_KEY',
    'MONGO_URI',
    'REDIS_URI',
  ]) {
    assert.match(envTemplate, new RegExp(`^${key}=`, 'm'), `Missing ${key}`);
  }
  assert.match(envTemplate, /LLM_API_KEY=/, 'Missing documented LLM_API_KEY placeholder');
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
  assert.match(compose, /mongo:[\s\S]*healthcheck:/);
  assert.match(compose, /redis:[\s\S]*healthcheck:/);
  assert.match(compose, /cron-worker:[\s\S]*profiles:\s*\n\s*-\s*full/);
  assert.match(compose, /8080:8080/);
  assert.match(compose, /27017:27017/);
});

test('nginx local development config proxies api traffic to express-api', () => {
  const nginxConfig = readFileSync('nginx/nginx.conf', 'utf8');
  assert.match(nginxConfig, /listen\s+8080;/);
  assert.match(nginxConfig, /location\s+\/api\/v1\//);
  assert.match(nginxConfig, /proxy_pass\s+http:\/\/express-api:3000/);
  assert.match(nginxConfig, /proxy_set_header\s+Host\s+\$host;/);
  assert.match(nginxConfig, /proxy_set_header\s+X-Forwarded-For\s+\$proxy_add_x_forwarded_for;/);
});

test('express-api source still exposes the nginx health contract', () => {
  const serverSource = readFileSync('backend/apps/express-api/src/server.ts', 'utf8');
  assert.match(serverSource, /app\.get\("\/api\/v1\/health", healthHandler\)/);
  assert.match(serverSource, /buildSuccessResponse\(\{ status: "ok" \}\)/);
  assert.match(serverSource, /app\.use\("\/api\/v1\/auth", authRouter\)/);
  assert.match(serverSource, /app\.use\("\/api\/v1\/recipes", recipesRouter\)/);
});
