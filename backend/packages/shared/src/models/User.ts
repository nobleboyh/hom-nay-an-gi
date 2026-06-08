import mongoose, { type InferSchemaType } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, default: null },
    googleId: { type: String, unique: true, sparse: true },
    displayName: { type: String, required: true },
    authProvider: {
      type: String,
      enum: ["email", "google"],
      required: true,
    },
    createdAt: { type: Date, default: Date.now, immutable: true },
    updatedAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date },
    deletedAt: { type: Date, default: null },
  },
  { strict: true },
);

userSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 2_592_000 });

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

userSchema.pre("save", function (next) {
  if (this.isModified("email") && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

export type IUser = InferSchemaType<typeof userSchema>;

export const User = mongoose.model<IUser>("User", userSchema);
