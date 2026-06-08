import { createServer } from "node:http";
import {
  connectDatabase,
  connectRedis,
  disconnectDatabase,
  disconnectRedis,
  env,
  logger,
} from "@hom-nay-an-gi/shared";
import { buildApp } from "./server.js";

const app = buildApp();
const server = createServer(app);

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down API server");

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  await Promise.allSettled([disconnectDatabase(), disconnectRedis()]);
  process.exit(0);
}

async function bootstrap(): Promise<void> {
  server.listen(env.PORT, "0.0.0.0", () => {
    logger.info({ port: env.PORT }, "API server listening");
  });

  await Promise.allSettled([connectDatabase(), connectRedis()]);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

void bootstrap();
