import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);
const ANDROID_EMULATOR_HOST = '10.0.2.2';

export class ApiBaseUrlConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiBaseUrlConfigurationError';
  }
}

function readExpoExtraApiBaseUrl(): string {
  const extra =
    Constants.expoConfig?.extra ??
    Constants.manifest?.extra ??
    Constants.manifest2?.extra?.expoClient?.extra;

  const value = extra?.apiBaseUrl;
  return typeof value === 'string' ? value : '';
}

function normalizeApiBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLoopbackUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

function isAllowedNativeSimulatorUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.hostname === ANDROID_EMULATOR_HOST;
  } catch {
    return false;
  }
}

function buildMissingConfigMessage(): string {
  return [
    '[env] Missing API_BASE_URL Expo config bridge.',
    'Set frontend/.env to API_BASE_URL=http://<LAN_IP>:8080 for Expo Go, then restart Expo.',
  ].join(' ');
}

function buildUnsafeConfigMessage(value: string): string {
  return [
    `[env] Unsafe API_BASE_URL for Expo runtime: ${value}.`,
    'Expo Go on a physical device needs a LAN-reachable host such as http://<LAN_IP>:8080.',
    'Use localhost only on web or an explicitly supported simulator host.',
  ].join(' ');
}

function buildInvalidConfigMessage(value: string): string {
  return [
    `[env] Invalid API_BASE_URL: ${value || '<empty>'}.`,
    'Set frontend/.env to a valid http(s) URL such as http://<LAN_IP>:8080 for Expo Go, then restart Expo.',
  ].join(' ');
}

export function resolveApiBaseUrl(): string {
  return normalizeApiBaseUrl(readExpoExtraApiBaseUrl());
}

export function getApiBaseUrlOrThrow(): string {
  const baseUrl = resolveApiBaseUrl();

  if (!baseUrl) {
    throw new ApiBaseUrlConfigurationError(buildMissingConfigMessage());
  }

  if (!isValidHttpUrl(baseUrl)) {
    throw new ApiBaseUrlConfigurationError(buildInvalidConfigMessage(baseUrl));
  }

  if (Platform.OS === 'web') {
    return baseUrl;
  }

  if (!Constants.isDevice && Platform.OS === 'ios' && isLoopbackUrl(baseUrl)) {
    return baseUrl;
  }

  if (isLoopbackUrl(baseUrl) && !isAllowedNativeSimulatorUrl(baseUrl)) {
    throw new ApiBaseUrlConfigurationError(buildUnsafeConfigMessage(baseUrl));
  }

  return baseUrl;
}

export function isApiBaseUrlConfigurationError(error: unknown): error is ApiBaseUrlConfigurationError {
  return error instanceof ApiBaseUrlConfigurationError;
}
