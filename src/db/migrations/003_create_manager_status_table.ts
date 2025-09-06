import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("manager_status", (table) => {
    table.increments("id").primary();
    table.string("customer_phone").unique().notNullable();
    table.string("manager_status").notNullable().defaultTo("OFF");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Foreign key to users table
    table.foreign("customer_phone").references("phone").inTable("users");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("manager_status");
}
