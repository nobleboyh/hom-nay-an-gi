import {
  connectDatabase,
  disconnectDatabase,
  logger,
  User,
  UserPreference,
} from "@hom-nay-an-gi/shared";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;

const TEST_USERS = [
  { email: "test@example.com", password: "password123", displayName: "Nguyen Van A" },
  { email: "demo@example.com", password: "demo1234", displayName: "Tran Thi B" },
];

async function seed() {
  await connectDatabase();

  for (const { email, password, displayName } of TEST_USERS) {
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      logger.info({ email }, "User already exists, skipping");
      continue;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      displayName,
      authProvider: "email",
    });

    await UserPreference.create({ userId: user._id, language: "vi" });
    logger.info({ email, displayName }, "Test user created");
  }

  await disconnectDatabase();

  console.log("\n--- Test accounts ---");
  for (const { email, password, displayName } of TEST_USERS) {
    console.log(`  Email: ${email}  Password: ${password}  Name: ${displayName}`);
  }
  console.log("---------------------\n");
}

seed().catch((err) => {
  logger.error({ err }, "Seed script failed");
  process.exit(1);
});
