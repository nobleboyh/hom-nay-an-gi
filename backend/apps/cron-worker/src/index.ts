import { logger } from "@hom-nay-an-gi/shared";

function logHeartbeat(): void {
  logger.info("cron-worker idle heartbeat");
}

const interval = setInterval(logHeartbeat, 60_000);
logHeartbeat();

function shutdown(signal: string): void {
  clearInterval(interval);
  logger.info({ signal }, "cron-worker shutting down");
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
