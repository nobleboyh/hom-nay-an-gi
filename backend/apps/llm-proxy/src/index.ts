import { env, getLlmConfig, logger } from "@hom-nay-an-gi/shared";
import cors from "cors";
import express from "express";

import { complete } from "./llmClient.js";

function getApiKey(): string {
  return process.env.LLM_API_KEY ?? "";
}

export function buildApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    response.json({
      success: true,
      data: {
        status: "ok",
        service: "llm-proxy",
        provider: getLlmConfig().provider,
      },
    });
  });

  app.post("/complete", async (request, response) => {
    const { prompt } = request.body as {
      prompt?: { system?: string; user?: string };
    };

    if (prompt?.system === undefined || prompt?.user === undefined) {
      response.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Missing required fields: prompt.system, prompt.user",
        },
      });
      return;
    }

    try {
      const result = await complete(
        prompt.system,
        prompt.user,
        { parse: (raw: unknown) => raw } as never,
        {
          provider: getLlmConfig().provider,
          apiKey: getApiKey(),
        },
      );

      response.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      logger.error({ err: error }, "LLM completion failed");

      response.status(502).json({
        success: false,
        error: {
          code: "LLM_PROVIDER_ERROR",
          message: error instanceof Error ? error.message : "LLM call failed",
        },
      });
    }
  });

  return app;
}

const app = buildApp();
const port = env.PORT;

app.listen(port, "0.0.0.0", () => {
  logger.info(
    { port, provider: getLlmConfig().provider },
    "LLM proxy server listening",
  );
});
