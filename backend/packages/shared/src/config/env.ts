import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGO_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/homnayangi"),
  REDIS_URI: z.string().min(1).default("redis://127.0.0.1:6379"),
  LLM_PROXY_URL: z.string().url().default("http://127.0.0.1:3001"),
  JWT_SECRET: z.string().min(16).default("replace-with-a-long-secret"),
  GOOGLE_CLIENT_ID: z.string().min(1).default("replace-with-google-client-id"),
  HERE_API_KEY: z.string().min(1).default("replace-with-here-api-key"),
  CORS_ORIGIN: z
    .string()
    .min(1)
    .default(
      "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8081,exp://127.0.0.1:19000,exp://localhost:19000",
    ),
  LLM_PROVIDER: z.string().min(1).default("ollama"),
  // LLM_PROVIDER: z.string().optional(),
  // LLM_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().min(1).default("llama3.2:1b"),
});

export type AppEnv = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
