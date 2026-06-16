import {
  buildErrorResponse,
  buildSuccessResponse,
  env,
  getLlmConfig,
  logger,
} from "@hom-nay-an-gi/shared";
import cors from "cors";
import express from "express";
import http from "http";

import { complete } from "./llmClient.js";

// ---- raw http server (from HEAD) ----

const llmConfig = getLlmConfig();
const LLM_API_KEY = process.env.LLM_API_KEY ?? "";
const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = "gemini-2.5-flash";
const LLM_TIMEOUT_MS = 15_000;

const MAX_BODY_SIZE = 1_048_576;
const PROMPT_MAX_LENGTH = 10_000;
const VALID_PROVIDERS = ["gemini"] as const;
type Provider = (typeof VALID_PROVIDERS)[number];

function parseJsonBody(request: http.IncomingMessage): Promise<{
  provider?: string;
  prompt?: string;
  schema?: Record<string, unknown>;
}> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error("Request body too large"));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

function sendJson(
  response: http.ServerResponse,
  statusCode: number,
  data: unknown,
) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(data));
}

async function handleGenerate(
  request: http.IncomingMessage,
  response: http.ServerResponse,
) {
  if (request.headers["content-type"]?.startsWith("application/json") !== true) {
    sendJson(
      response,
      400,
      buildErrorResponse("VALIDATION_ERROR", "Content-Type must be application/json"),
    );
    return;
  }

  let body: {
    provider?: string;
    prompt?: string;
    schema?: Record<string, unknown>;
  };

  try {
    body = await parseJsonBody(request);
  } catch {
    sendJson(
      response,
      400,
      buildErrorResponse("VALIDATION_ERROR", "Invalid JSON body"),
    );
    return;
  }

  if (!body.prompt) {
    sendJson(
      response,
      400,
      buildErrorResponse("VALIDATION_ERROR", "Prompt is required"),
    );
    return;
  }

  if (body.prompt.length > PROMPT_MAX_LENGTH) {
    sendJson(
      response,
      400,
      buildErrorResponse("VALIDATION_ERROR", `Prompt exceeds ${PROMPT_MAX_LENGTH} character limit`),
    );
    return;
  }

  if (!LLM_API_KEY) {
    sendJson(
      response,
      502,
      buildErrorResponse("LLM_PROVIDER_ERROR", "LLM_API_KEY is not configured"),
    );
    return;
  }

  const rawProvider = body.provider ?? llmConfig.provider;
  if (!rawProvider || !VALID_PROVIDERS.includes(rawProvider as Provider)) {
    sendJson(
      response,
      400,
      buildErrorResponse("VALIDATION_ERROR", `Unsupported provider: ${rawProvider}`),
    );
    return;
  }
  const provider = rawProvider as Provider;

  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    let generatedText: string;

    if (provider === "gemini") {
      const geminiBody: Record<string, unknown> = {
        contents: [
          {
            parts: [{ text: body.prompt }],
          },
        ],
      };

      if (body.schema) {
        const isArray = body.schema.type === "array";
        geminiBody.systemInstruction = {
          parts: [
            {
              text: `You must respond with valid JSON matching this schema: ${JSON.stringify(body.schema)}. Return ONLY the JSON ${isArray ? "array" : "object"}, no markdown, no explanation.`,
            },
          ],
        };
        geminiBody.generationConfig = {
          response_mime_type: "application/json",
          response_schema: body.schema,
        };
      }

      const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent`;
      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": LLM_API_KEY,
        },
        body: JSON.stringify(geminiBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        logger.error(
          { status: geminiResponse.status, errorText },
          "Gemini API error",
        );
        sendJson(
          response,
          502,
          buildErrorResponse(
            "LLM_PROVIDER_ERROR",
            `Gemini API returned ${geminiResponse.status}`,
          ),
        );
        return;
      }

      const readTimeout = AbortSignal.timeout(10_000);
      const geminiData = (await geminiResponse.json({ signal: readTimeout })) as {
        candidates?: {
          content?: { parts?: { text?: string }[] };
          finishReason?: string;
        }[];
      };

      const candidate = geminiData?.candidates?.[0];
      if (!candidate?.content?.parts?.length) {
        const reason = candidate?.finishReason ?? "unknown";
        logger.error({ finishReason: reason }, "Gemini returned no content");
        sendJson(
          response,
          502,
          buildErrorResponse(
            "LLM_INVALID_RESPONSE",
            `Gemini returned no content (finishReason: ${reason})`,
          ),
        );
        return;
      }

      generatedText = candidate.content.parts[0]?.text ?? "";
    } else {
      clearTimeout(timeout);
      sendJson(
        response,
        502,
        buildErrorResponse(
          "LLM_PROVIDER_ERROR",
          `Unsupported provider: ${provider}`,
        ),
      );
      return;
    }

    if (!generatedText) {
      sendJson(
        response,
        502,
        buildErrorResponse(
          "LLM_INVALID_RESPONSE",
          "LLM returned empty content",
        ),
      );
      return;
    }

    sendJson(
      response,
      200,
      buildSuccessResponse({
        content: generatedText,
        provider,
        model: GEMINI_MODEL,
      }),
    );
  } catch (error: unknown) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === "AbortError") {
      sendJson(
        response,
        502,
        buildErrorResponse("LLM_TIMEOUT", "LLM request timed out"),
      );
      return;
    }
    logger.error({ error }, "LLM proxy generate error");
    sendJson(
      response,
      502,
      buildErrorResponse("LLM_PROVIDER_ERROR", "LLM request failed"),
    );
  }
}

export function createServer() {
  return http.createServer(
    (request: http.IncomingMessage, response: http.ServerResponse) => {
      if (request.method === "GET" && request.url === "/health") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify(
            buildSuccessResponse({
              status: "ok",
              service: "llm-proxy",
              provider: llmConfig.provider,
            }),
          ),
        );
        return;
      }

      if (request.method === "POST" && request.url === "/generate") {
        handleGenerate(request, response).catch((error) => {
          logger.error({ error }, "handleGenerate unhandled rejection");
        });
        return;
      }

      response.writeHead(404, { "content-type": "application/json" });
      response.end(
        JSON.stringify(buildErrorResponse("NOT_FOUND", "Route not found")),
      );
    },
  );
}

// ---- express server (from main) ----

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

const server = createServer();
server.listen(env.PORT, "0.0.0.0", () => {
  logger.info(
    { port, provider: getLlmConfig().provider },
    "LLM proxy server listening",
  );
});

const app = buildApp();
app.listen(env.PORT, "0.0.0.0", () => {
  logger.info(
    { port, provider: getLlmConfig().provider },
    "LLM proxy server listening",
  );
});
