import fs from 'node:fs';
import path from 'node:path';
import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json') as { expo: ExpoConfig };

function readDotEnvApiBaseUrl(): string {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return '';
  }

  const source = fs.readFileSync(envPath, 'utf8');

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    if (key !== 'API_BASE_URL') {
      continue;
    }

    const rawValue = trimmed.slice(separator + 1).trim();
    return rawValue.replace(/^(['"])(.*)\1$/, '$2');
  }

  return '';
}

const apiBaseUrl = process.env.API_BASE_URL ?? readDotEnvApiBaseUrl();

const config: ExpoConfig = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    apiBaseUrl,
  },
};

export default config;
