import { Platform } from 'react-native';

type MonitoringContext = {
  extra?: Record<string, unknown>;
};

type MonitoringState = {
  enabled: boolean;
  reason: string;
  dsn: string | null;
};

type MonitoringClient = {
  captureException(error: unknown, context?: MonitoringContext): void;
  init(config: {
    dsn: string;
    enableInExpoDevelopment: boolean;
    debug: boolean;
    tracesSampleRate: number;
  }): void;
};

const COMPATIBILITY_DECISION =
  'Monitoring is temporarily disabled for the current Expo SDK 54 / Expo Router / React Native Web compatibility path until a supported vendor integration is adopted.';

let warned = false;
let initialized = false;
let monitoringClient: MonitoringClient | null | undefined;
const preparedErrors = new WeakSet<object>();

function isTrackableError(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function warnMonitoring(reason: string) {
  if (warned) {
    return;
  }

  warned = true;
  console.warn(`[monitoring] ${reason}`);
}

function resolveMonitoringState(): MonitoringState {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn || dsn.startsWith('replace-with-')) {
    return {
      enabled: false,
      reason: 'SENTRY_DSN is missing or still using the placeholder value.',
      dsn: null,
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    return {
      enabled: false,
      reason: 'Monitoring is disabled outside production builds to keep unsupported environments fail-closed.',
      dsn,
    };
  }

  if (Platform.OS === 'web') {
    return {
      enabled: false,
      reason: COMPATIBILITY_DECISION,
      dsn,
    };
  }

  return {
    enabled: true,
    reason: 'Monitoring is enabled.',
    dsn,
  };
}

function getMonitoringClient(): MonitoringClient | null {
  if (monitoringClient !== undefined) {
    return monitoringClient;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sentryModule = require('sentry-expo');
    const captureTarget = sentryModule.Native ?? sentryModule.Browser ?? sentryModule;

    if (
      typeof sentryModule.init !== 'function' ||
      typeof captureTarget.captureException !== 'function'
    ) {
      warnMonitoring('Monitoring SDK did not expose the expected init/capture APIs.');
      monitoringClient = null;
      return monitoringClient;
    }

    monitoringClient = {
      init: sentryModule.init,
      captureException: captureTarget.captureException.bind(captureTarget),
    };

    return monitoringClient;
  } catch (error) {
    warnMonitoring(
      error instanceof Error
        ? `Monitoring SDK failed to load safely: ${error.message}`
        : 'Monitoring SDK failed to load safely.',
    );
    monitoringClient = null;
    return monitoringClient;
  }
}

export function initMonitoring(): MonitoringState {
  const state = resolveMonitoringState();

  if (!state.enabled) {
    if (state.dsn) {
      warnMonitoring(state.reason);
    }
    return state;
  }

  const client = getMonitoringClient();
  if (!client) {
    return {
      enabled: false,
      reason: 'Monitoring SDK could not be initialized safely.',
      dsn: state.dsn,
    };
  }

  if (initialized) {
    return state;
  }

  try {
    client.init({
      dsn: state.dsn!,
      enableInExpoDevelopment: false,
      debug: false,
      tracesSampleRate: 0.1,
    });
    initialized = true;
  } catch (error) {
    warnMonitoring(
      error instanceof Error
        ? `Monitoring init failed safely: ${error.message}`
        : 'Monitoring init failed safely.',
    );
    return {
      enabled: false,
      reason: 'Monitoring SDK could not be initialized safely.',
      dsn: state.dsn,
    };
  }

  return state;
}

export function prepareMonitoringException(error: unknown): void {
  if (isTrackableError(error)) {
    preparedErrors.add(error);
  }
}

export function captureMonitoringException(
  error: unknown,
  context: MonitoringContext = {},
): void {
  const state = resolveMonitoringState();
  if (!state.enabled) {
    if (state.dsn) {
      warnMonitoring(state.reason);
    }
    return;
  }

  const client = getMonitoringClient();
  if (!client) {
    return;
  }

  const mergedContext =
    isTrackableError(error) && preparedErrors.has(error)
      ? {
          ...context,
          extra: {
            preparedBeforeFallback: true,
            ...context.extra,
          },
        }
      : context;

  try {
    client.captureException(error, mergedContext);
  } catch (captureError) {
    warnMonitoring(
      captureError instanceof Error
        ? `Monitoring capture failed safely: ${captureError.message}`
        : 'Monitoring capture failed safely.',
    );
  }
}
