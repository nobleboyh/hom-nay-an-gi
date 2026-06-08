import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Favorite, SearchHistory, User, UserPreference } from "../src/index.js";

const CUSTOM_URI = process.env.MONGO_URI;
const mongoAvailable = Boolean(CUSTOM_URI);

const MONGO_URI = CUSTOM_URI || "mongodb://127.0.0.1:27017/homnayangi-test";

const itIfMongo = mongoAvailable ? it : it.skip;

async function clearCollections(): Promise<void> {
  const collections = mongoose.connection.collections ?? {};
  for (const key of Object.keys(collections)) {
    await collections[key]?.deleteMany({});
  }
}

describe("Mongoose Models", () => {
  beforeAll(async () => {
    if (mongoAvailable) {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5_000,
      });
    }
  }, 10_000);

  afterAll(async () => {
    if (mongoAvailable) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    if (mongoAvailable) {
      await clearCollections();
    }
  });

  describe("User", () => {
    itIfMongo("creates and reads a User document", async () => {
      const user = await User.create({
        email: "test@example.com",
        displayName: "Test User",
        authProvider: "email",
        passwordHash: "hashed_value",
      });
      expect(user.email).toBe("test@example.com");
      expect(user.displayName).toBe("Test User");
      expect(user.authProvider).toBe("email");
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    itIfMongo("auto-lowercases email on save", async () => {
      const user = await User.create({
        email: "Test@Example.COM",
        displayName: "User",
        authProvider: "email",
      });
      expect(user.email).toBe("test@example.com");
    });

    itIfMongo("enforces email unique constraint", async () => {
      await User.create({
        email: "unique@test.com",
        displayName: "First",
        authProvider: "email",
      });

      await expect(
        User.create({
          email: "unique@test.com",
          displayName: "Second",
          authProvider: "email",
        }),
      ).rejects.toMatchObject({ code: 11000 });
    });

    itIfMongo("allows null email for google-only users", async () => {
      const user = await User.create({
        googleId: "g-12345",
        displayName: "Google User",
        authProvider: "google",
      });
      expect(user.email).toBeNull();
      expect(user.googleId).toBe("g-12345");
    });

    itIfMongo("enforces googleId unique constraint", async () => {
      await User.create({
        googleId: "g-unique",
        displayName: "First",
        authProvider: "google",
      });

      await expect(
        User.create({
          googleId: "g-unique",
          displayName: "Second",
          authProvider: "google",
        }),
      ).rejects.toMatchObject({ code: 11000 });
    });

    itIfMongo("has deletedAt TTL index with 30-day expiration", async () => {
      const indexes = await User.collection.indexes();
      const ttlIndex = indexes.find(
        (idx) => idx.key && "deletedAt" in (idx.key as Record<string, unknown>),
      );
      expect(ttlIndex).toBeDefined();
      expect((ttlIndex as Record<string, unknown>)?.expireAfterSeconds).toBe(
        2_592_000,
      );
    });
  });

  describe("Favorite", () => {
    itIfMongo("creates and reads a Favorite document", async () => {
      const user = await User.create({
        displayName: "Fav User",
        authProvider: "email",
        email: "fav@test.com",
      });

      const fav = await Favorite.create({
        userId: user._id,
        dishId: "a4957b42-fb54-4b7e-ac50-d7e8192f4202",
        dishData: {
          name: "Pho bo",
          cuisine: "Mien Bac",
          cookTimeMinutes: 75,
          caloriesPerServing: 450,
        },
      });

      expect(fav.dishId).toBe("a4957b42-fb54-4b7e-ac50-d7e8192f4202");
      expect(fav.dishData?.name).toBe("Pho bo");
      expect(fav.savedAt).toBeInstanceOf(Date);
    });

    itIfMongo("enforces compound unique {userId, dishId}", async () => {
      const user = await User.create({
        displayName: "Fav Dup User",
        authProvider: "email",
        email: "favdup@test.com",
      });

      await Favorite.create({
        userId: user._id,
        dishId: "768f269f-e9ba-499a-b26b-acaf74253aca",
        dishData: { name: "Pho bo" },
      });

      await expect(
        Favorite.create({
          userId: user._id,
          dishId: "768f269f-e9ba-499a-b26b-acaf74253aca",
          dishData: { name: "Pho bo duplicate" },
        }),
      ).rejects.toMatchObject({ code: 11000 });
    });

    itIfMongo("updates updatedAt on save", async () => {
      const user = await User.create({
        displayName: "Update User",
        authProvider: "email",
        email: "update@test.com",
      });

      const fav = await Favorite.create({
        userId: user._id,
        dishId: "71f05f5d-9435-4ae8-a498-5b0ee42f8342",
        dishData: { name: "Bun cha" },
      });

      const originalUpdated = fav.updatedAt.getTime();
      await new Promise((r) => setTimeout(r, 10));
      if (fav.dishData) {
        fav.dishData.name = "Bun cha Ha Noi";
      }
      await fav.save();

      expect(fav.updatedAt.getTime()).toBeGreaterThan(originalUpdated);
    });
  });

  describe("SearchHistory", () => {
    itIfMongo(
      "creates a SearchHistory document with auto-expiresAt",
      async () => {
        const entry = await SearchHistory.create({
          ingredients: ["thit ga", "bong cai"],
          tags: ["Viet Nam"],
          cookTimeMax: 30,
          resultCount: 5,
        });

        expect(entry.ingredients).toHaveLength(2);
        expect(entry.expiresAt).toBeInstanceOf(Date);

        const expectedExpiry = new Date(
          entry.createdAt.getTime() + 90 * 24 * 60 * 60 * 1_000,
        );
        const diffMs = Math.abs(
          (entry.expiresAt?.getTime() ?? 0) - expectedExpiry.getTime(),
        );
        expect(diffMs).toBeLessThan(1_000);
      },
    );

    itIfMongo("supports null userId for guest entries", async () => {
      const entry = await SearchHistory.create({
        guestDeviceId: "device-abc",
        ingredients: ["trung"],
      });

      expect(entry.userId).toBeNull();
      expect(entry.guestDeviceId).toBe("device-abc");
    });
  });

  describe("UserPreference", () => {
    itIfMongo("creates a UserPreference with defaults", async () => {
      const user = await User.create({
        displayName: "Pref User",
        authProvider: "email",
        email: "pref@test.com",
      });

      const prefs = await UserPreference.create({ userId: user._id });

      expect(prefs.dietaryPreferences).toEqual([]);
      expect(prefs.measurementUnit).toBe("metric");
      expect(prefs.language).toBe("vi");
    });
  });
});
