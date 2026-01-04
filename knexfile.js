"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    development: {
        client: "postgresql",
        connection: {
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT || "5433"),
            database: process.env.DB_NAME || "byb_bot",
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASSWORD || "T!t135642",
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: "knex_migrations",
            directory: "./src/db/migrations",
        },
        seeds: {
            directory: "./src/db/seeds",
        },
    },
    production: {
        client: "postgresql",
        connection: {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || "5432"),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: { rejectUnauthorized: false },
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: "knex_migrations",
            directory: "./src/db/migrations",
        },
    },
};
exports.default = config;
