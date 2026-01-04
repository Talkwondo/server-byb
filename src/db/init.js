"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.initializeDatabase = void 0;
const connection_1 = require("./connection");
const initializeDatabase = async () => {
    try {
        // Test database connection
        await connection_1.db.raw("SELECT 1");
        console.log("✅ Database connection successful");
        // Check if migrations table exists
        const hasMigrations = await connection_1.db.schema.hasTable("knex_migrations");
        if (!hasMigrations) {
            console.log("⚠️  Database migrations not run. Please run: npm run db:migrate");
        }
        else {
            console.log("✅ Database migrations are up to date");
        }
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
const closeDatabase = async () => {
    await connection_1.db.destroy();
    console.log("Database connection closed");
};
exports.closeDatabase = closeDatabase;
