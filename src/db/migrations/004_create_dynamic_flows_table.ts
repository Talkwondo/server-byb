import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("dynamic_flows", (table) => {
    table.increments("id").primary();
    table.string("flow_id").unique().notNullable();
    table.string("flow_token").unique().notNullable();
    table.string("customer_phone").notNullable();
    table.string("flow_type").notNullable();
    table.jsonb("flow_data");
    table.jsonb("encrypted_metadata").notNullable();
    table
      .enum("status", ["active", "completed", "expired"])
      .defaultTo("active");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("expires_at").notNullable();
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Foreign key to users table
    table.foreign("customer_phone").references("phone").inTable("users");

    // Indexes for performance
    table.index(["flow_token"]);
    table.index(["customer_phone"]);
    table.index(["status"]);
    table.index(["expires_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("dynamic_flows");
}
