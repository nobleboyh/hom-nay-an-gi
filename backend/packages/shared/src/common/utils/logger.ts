import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const loggerOptions = isProduction
  ? {
      level: process.env.LOG_LEVEL ?? "info",
    }
  : {
      level: process.env.LOG_LEVEL ?? "debug",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    };

export const logger = pino(loggerOptions);
