import http from "node:http";
import {
  buildErrorResponse,
  buildSuccessResponse,
  env,
  getLlmConfig,
  logger,
} from "@hom-nay-an-gi/shared";

const llmConfig = getLlmConfig();

const server = http.createServer((request, response) => {
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

  response.writeHead(404, { "content-type": "application/json" });
  response.end(
    JSON.stringify(buildErrorResponse("NOT_FOUND", "Route not found")),
  );
});

server.listen(env.PORT, "0.0.0.0", () => {
  logger.info(
    { port: env.PORT, target: env.LLM_PROXY_URL },
    "LLM proxy placeholder listening",
  );
});
