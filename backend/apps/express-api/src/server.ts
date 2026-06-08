import {
  buildSuccessResponse,
  env,
  errorHandler,
  generalLimiter,
  notFoundHandler,
  parseCorsOrigins,
  requestLogger,
} from "@hom-nay-an-gi/shared";
import cors, { type CorsOptionsDelegate } from "cors";
import express from "express";
import helmet from "helmet";

const allowedOrigins = parseCorsOrigins(env.CORS_ORIGIN);

const corsOptionsDelegate: CorsOptionsDelegate = (request, callback) => {
  const requestOrigin = request.headers?.origin;
  const isAllowed =
    requestOrigin === undefined ||
    allowedOrigins.includes(requestOrigin) ||
    allowedOrigins.includes("*");

  callback(null, {
    origin: isAllowed,
    credentials: true,
  });
};

const helmetOptions =
  env.NODE_ENV === "production" ? {} : { contentSecurityPolicy: false };

export function healthHandler(
  _request: express.Request,
  response: express.Response,
): void {
  response.status(200).json(buildSuccessResponse({ status: "ok" }));
}

export function helloHandler(
  _request: express.Request,
  response: express.Response,
): void {
  response.status(200).json(
    buildSuccessResponse({
      message: "hello world",
      source: "express-api",
    }),
  );
}

export function buildApp(): express.Express {
  const app = express();

  app.use(helmet(helmetOptions));
  app.use(cors(corsOptionsDelegate));
  app.use(express.json());

  app.use(requestLogger);
  app.use(generalLimiter);

  app.get("/api/v1/health", healthHandler);
  app.get("/api/v1/hello", helloHandler);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
