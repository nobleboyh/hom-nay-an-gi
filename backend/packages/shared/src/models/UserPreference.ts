import mongoose, { type InferSchemaType } from "mongoose";

const userPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    dietaryPreferences: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    dislikedIngredients: { type: [String], default: [] },
    preferredCuisines: { type: [String], default: [] },
    measurementUnit: {
      type: String,
      enum: ["metric", "imperial"],
      default: "metric",
    },
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "light",
    },
    language: {
      type: String,
      enum: ["vi", "en"],
      default: "vi",
    },
    notifications: {
      breakfastReminder: { type: Boolean, default: false },
      lunchReminder: { type: Boolean, default: false },
      dinnerReminder: { type: Boolean, default: false },
      dailySuggestion: { type: Boolean, default: false },
    },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { strict: true },
);

userPreferenceSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export type IUserPreference = InferSchemaType<typeof userPreferenceSchema>;

export const UserPreference = mongoose.model<IUserPreference>(
  "UserPreference",
  userPreferenceSchema,
);
