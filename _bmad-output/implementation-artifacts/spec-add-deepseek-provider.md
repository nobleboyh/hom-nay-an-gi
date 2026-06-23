---
title: 'Add DeepSeek LLM Provider'
type: 'feature'
created: '2026-06-23T00:00:00+07:00'
status: 'done'
baseline_commit: '612acb897325b9dec55c9cea9a79e48e7a99e84c'
context:
  - '{project-root}/_bmad-output/planning-artifacts/epics/epic-2.md'
  - '{project-root}/docs/code-placement-conventions.md'
---

<frozen-after-approval reason="human-owned intent -- do not modify unless human renegotiates">

## Intent

**Problem:** The backend LLM proxy cannot be configured with `LLM_PROVIDER=deepseek`, so a DeepSeek API key in `LLM_API_KEY` is unusable even though the provider abstraction is intended to be swappable.

**Approach:** Add DeepSeek as an OpenAI-compatible provider in both LLM proxy call paths, keep `LLM_API_KEY` as the only required credential, and document the provider setting for local/Docker use.

## Boundaries & Constraints

**Always:** `LLM_PROVIDER=deepseek` must be accepted by shared env validation. DeepSeek calls must use `LLM_API_KEY` as a bearer token against DeepSeek's OpenAI-compatible chat completions endpoint. Existing providers (`ollama`, `gemini`, `openai`, `anthropic`) must retain current behavior.

**Ask First:** Adding new dependencies, changing public API request/response shapes, renaming env vars, or introducing provider-specific model env vars beyond the existing scope requires human approval.

**Never:** Do not store API keys outside env vars. Do not replace the existing provider abstraction with DeepSeek-only logic. Do not remove the local Ollama default.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| DeepSeek complete happy path | `complete(..., { provider: "deepseek", apiKey: "key" })` and DeepSeek returns JSON text in `choices[0].message.content` | Parsed data validates through the supplied Zod schema; metadata reports `provider: "deepseek"`, `source: "llm"`, `degraded: false` | N/A |
| DeepSeek generate happy path | `POST /generate` body uses `provider: "deepseek"` and `LLM_API_KEY` is set | Response is `200` with generated `content`, `provider: "deepseek"`, and the DeepSeek model name | N/A |
| Missing API key | `LLM_PROVIDER=deepseek` but `LLM_API_KEY` is absent | Endpoint and client fail through existing provider-error/degraded fallback paths | Preserve existing `LLM_PROVIDER_ERROR` behavior for `/generate`; preserve seed fallback in `complete()` |
| Unsupported provider | Request uses any provider outside the allowed set | Existing validation rejects the request | Return existing `VALIDATION_ERROR` response |

</frozen-after-approval>

## Code Map

- `backend/packages/shared/src/config/env.ts` -- validates accepted `LLM_PROVIDER` values.
- `backend/apps/llm-proxy/src/llmClient.ts` -- provider adapter abstraction used by `/complete` and express-api recipe calls.
- `backend/apps/llm-proxy/src/index.ts` -- raw `/generate` endpoint currently hardcoded to Gemini-only provider allowlist and Gemini request shape.
- `backend/apps/llm-proxy/tests/llmClient.test.ts` -- unit coverage for provider adapter behavior and fallback behavior.
- `backend/apps/llm-proxy/src/__tests__/generate.test.ts` -- integration-style coverage for `/generate` request validation and provider calls.
- `backend/apps/llm-proxy/vite.config.mts` -- includes llm-proxy test files in the package test suite.
- `.env.template`, `backend/.env.template`, `docker-compose.yml` -- provider setup examples for local and Docker execution.
- `README.md` -- documents env usage for local and Docker provider switching.

## Tasks & Acceptance

**Execution:**
- [x] `backend/packages/shared/src/config/env.ts` -- add `"deepseek"` to `LLM_PROVIDER` enum -- allows process startup with `LLM_PROVIDER=deepseek`.
- [x] `backend/apps/llm-proxy/src/llmClient.ts` -- add DeepSeek adapter using `https://api.deepseek.com/v1/chat/completions`, `deepseek-chat`, bearer auth, JSON response parsing, and existing validation/fallback flow -- enables structured completions.
- [x] `backend/apps/llm-proxy/src/index.ts` -- extend `/generate` provider allowlist and request branch for DeepSeek using the same `LLM_API_KEY` and OpenAI-compatible response parsing -- enables existing raw generate callers.
- [x] `backend/apps/llm-proxy/tests/llmClient.test.ts` -- add a DeepSeek happy-path test and preserve existing provider tests -- prevents regressions in provider selection.
- [x] `backend/apps/llm-proxy/src/__tests__/generate.test.ts` -- add `/generate` DeepSeek happy-path coverage and keep unsupported-provider validation intact -- covers endpoint-level behavior.
- [x] `backend/apps/llm-proxy/vite.config.mts` -- include `src/**/*.test.ts` so the existing generate endpoint tests run in `pnpm --filter @hom-nay-an-gi/llm-proxy test` -- prevents unexecuted endpoint coverage.
- [x] `.env.template`, `backend/.env.template`, `docker-compose.yml`, `README.md` -- document `LLM_PROVIDER=deepseek` with `LLM_API_KEY` -- makes the feature usable without code inspection.

**Acceptance Criteria:**
- Given `LLM_PROVIDER=deepseek` and `LLM_API_KEY` is set, when the LLM proxy starts, then shared env parsing accepts the provider.
- Given the structured `complete()` path uses provider `deepseek`, when DeepSeek returns valid JSON content, then the caller receives typed data and metadata identifies DeepSeek as the provider.
- Given `/generate` receives `provider: "deepseek"`, when DeepSeek returns chat completion content, then the endpoint returns `200` with content and provider metadata.
- Given existing Gemini/OpenAI/Anthropic/Ollama tests run, when DeepSeek support is added, then existing provider behavior remains passing.

## Spec Change Log

## Design Notes

DeepSeek's chat API is OpenAI-compatible enough for this codebase's current `fetch` adapter style. The implementation should not add the OpenAI SDK; it should mirror the existing raw HTTP adapter and extract JSON from `choices[0].message.content`.

## Verification

**Commands:**
- `pnpm --filter @hom-nay-an-gi/llm-proxy test` -- expected: all llm-proxy tests pass.
- `pnpm --filter @hom-nay-an-gi/shared test` -- expected: shared env/config tests pass, if present in the package test command.

## Suggested Review Order

**Provider Execution**

- Start here for the reusable OpenAI-compatible provider design.
  [`llmClient.ts:119`](../../backend/apps/llm-proxy/src/llmClient.ts#L119)

- DeepSeek intentionally omits JSON-object response format for array compatibility.
  [`llmClient.ts:181`](../../backend/apps/llm-proxy/src/llmClient.ts#L181)

- Raw `/generate` allowlist and model constants define endpoint support.
  [`index.ts:21`](../../backend/apps/llm-proxy/src/index.ts#L21)

- DeepSeek `/generate` builds schema-aware prompts without constraining arrays.
  [`index.ts:233`](../../backend/apps/llm-proxy/src/index.ts#L233)

**Configuration And Docs**

- Shared env validation now accepts `LLM_PROVIDER=deepseek`.
  [`env.ts:26`](../../backend/packages/shared/src/config/env.ts#L26)

- README shows the exact DeepSeek env configuration.
  [`README.md:80`](../../README.md#L80)

**Tests**

- Structured client test verifies DeepSeek URL, auth, metadata, and payload shape.
  [`llmClient.test.ts:52`](../../backend/apps/llm-proxy/tests/llmClient.test.ts#L52)

- Endpoint test verifies array-schema DeepSeek requests avoid `response_format`.
  [`generate.test.ts:161`](../../backend/apps/llm-proxy/src/__tests__/generate.test.ts#L161)

- Vitest now runs colocated endpoint tests under `src`.
  [`vite.config.mts:5`](../../backend/apps/llm-proxy/vite.config.mts#L5)
