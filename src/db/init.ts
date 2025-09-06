import { db } from "./connection";

export const initializeDatabase = async () => {
  try {
    // Test database connection
    await db.raw("SELECT 1");
    console.log("✅ Database connection successful");

    // Check if migrations table exists
    const hasMigrations = await db.schema.hasTable("knex_migrations");
    if (!hasMigrations) {
      console.log(
        "⚠️  Database migrations not run. Please run: npm run db:migrate"
      );
    } else {
      console.log("✅ Database migrations are up to date");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
};

export const closeDatabase = async () => {
  await db.destroy();
  console.log("Database connection closed");
};
