import mongoose, { type InferSchemaType } from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dishId: { type: String, required: true },
    dishData: {
      name: { type: String, required: true },
      nameEn: { type: String },
      cuisine: { type: String },
      cookTimeMinutes: { type: Number },
      caloriesPerServing: { type: Number },
      tags: { type: [String] },
      imageDescription: { type: String },
    },
    savedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { strict: true },
);

favoriteSchema.index({ userId: 1, dishId: 1 }, { unique: true });
favoriteSchema.index({ userId: 1, savedAt: -1 });

favoriteSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export type IFavorite = InferSchemaType<typeof favoriteSchema>;

export const Favorite = mongoose.model<IFavorite>("Favorite", favoriteSchema);
