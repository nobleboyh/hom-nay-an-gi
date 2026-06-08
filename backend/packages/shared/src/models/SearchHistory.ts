import mongoose, { type InferSchemaType } from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guestDeviceId: { type: String },
    ingredients: { type: [String] },
    tags: { type: [String] },
    cookTimeMax: { type: Number },
    resultCount: { type: Number },
    resultDishIds: { type: [String] },
    selectedDishId: { type: String },
    createdAt: { type: Date, default: Date.now, immutable: true },
    expiresAt: { type: Date },
  },
  { strict: true },
);

searchHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
searchHistorySchema.index({ userId: 1, createdAt: -1 });

searchHistorySchema.pre("validate", function (next) {
  if (!this.expiresAt) {
    const ninetyDays = 90 * 24 * 60 * 60 * 1_000;
    this.expiresAt = new Date(this.createdAt.getTime() + ninetyDays);
  }
  next();
});

export type ISearchHistory = InferSchemaType<typeof searchHistorySchema>;

export const SearchHistory = mongoose.model<ISearchHistory>(
  "SearchHistory",
  searchHistorySchema,
);
