import { env } from "./env.js";

export type LlmConfig = {
  provider: string;
  proxyUrl: string;
};

export function getLlmConfig(): LlmConfig {
  return {
    provider: env.LLM_PROVIDER,
    proxyUrl: env.LLM_PROXY_URL,
  };
}
