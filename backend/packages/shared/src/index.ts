export type { ZodType } from "zod";
export {
  type CookingStep,
  CookingStepSchema,
  type Dish,
  DishArraySchema,
  type DishIdParams,
  DishIdParamsSchema,
  DishSchema,
  type Ingredient as RecipeIngredient,
  IngredientSchema as RecipeIngredientSchema,
  type LlmDishResponse,
  LlmDishResponseSchema,
  type RecipeDetail,
  type SearchMeta,
  type SearchParams,
  SearchParamsSchema,
  type SearchResult,
  type SurpriseMeParams,
  SurpriseMeSchema,
} from "./api/recipes/recipesValidation.js";
export { asyncHandler } from "./common/middleware/asyncHandler.js";
export { authenticate, signJwt } from "./common/middleware/authenticate.js";
export {
  errorHandler,
  notFoundHandler,
} from "./common/middleware/errorHandler.js";
export { generalLimiter, llmLimiter } from "./common/middleware/rateLimiter.js";
export { requestLogger } from "./common/middleware/requestLogger.js";
export type { ValidatedRequest } from "./common/middleware/validate.js";
export { validate } from "./common/middleware/validate.js";
export type {
  ErrorDetail,
  ErrorResponse,
  SuccessResponse,
} from "./common/models/serviceResponse.js";
export { ServiceResponse } from "./common/models/serviceResponse.js";
export type {
  ErrorEnvelope,
  SuccessEnvelope,
} from "./common/utils/apiResponse.js";
export {
  buildErrorResponse,
  buildSuccessResponse,
} from "./common/utils/apiResponse.js";
export { parseCorsOrigins } from "./common/utils/cors.js";
export {
  AppError,
  AuthenticationError,
  LLMError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "./common/utils/errors.js";
export { logger } from "./common/utils/logger.js";
export { connectDatabase, disconnectDatabase } from "./config/database.js";
export type { AppEnv } from "./config/env.js";
export { env } from "./config/env.js";
export type { LlmConfig } from "./config/llm.js";
export { getLlmConfig } from "./config/llm.js";
export { connectRedis, disconnectRedis, redis } from "./config/redis.js";
export {
  type Ingredient,
  type SeedRecipe,
  SeedRecipeArraySchema,
  SeedRecipeSchema,
  type Step,
} from "./data/seed-recipes.schema.js";
export { Favorite, type IFavorite } from "./models/Favorite.js";
export { type ISearchHistory, SearchHistory } from "./models/SearchHistory.js";
export { type IUser, User } from "./models/User.js";

export {
  type IUserPreference,
  UserPreference,
} from "./models/UserPreference.js";
export {
  cacheDel,
  cacheGet,
  cacheSet,
  rateLimitKey,
  recipeSearchKey,
  sessionKey,
  surpriseKey,
  trendingKey,
} from "./services/cacheClient.js";
export {
  buildIngredientSearchPrompt,
  buildSurprisePrompt,
} from "./services/prompts.js";
export {
  buildIngredientTokens,
  getRandomSeedRecipe,
  jaccardSimilarity,
  searchSeedRecipes,
} from "./services/seedMatcher.js";
