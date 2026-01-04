"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.PostgresDao = void 0;
const connection_1 = require("./connection");
class PostgresDao {
    async storeMessage(data) {
        // First ensure user exists
        await this.ensureUser(data.customerPhone);
        // Convert Unix timestamp to proper timestamp format
        const timestampValue = new Date(parseInt(data.timestamp) * 1000);
        // Store message
        await (0, connection_1.db)("messages").insert({
            customer_phone: data.customerPhone,
            business_phone: "default", // You can make this configurable
            timestamp: timestampValue,
            order_data: JSON.stringify(data.order),
            matched_items: JSON.stringify(data.matchedItems),
            name: data.name,
            flow_counter: data.flowCounter,
        });
        console.log("Message stored in PostgreSQL:", data);
    }
    async getMessage(customerPhone) {
        const result = await (0, connection_1.db)("messages")
            .where("customer_phone", customerPhone)
            .orderBy("created_at", "desc")
            .first();
        if (!result)
            return null;
        return {
            customerPhone: result.customer_phone,
            timestamp: result.timestamp,
            order: result.order_data,
            matchedItems: result.matched_items,
            name: result.name,
            flowCounter: result.flow_counter,
        };
    }
    async deleteMessage(customerPhone) {
        await (0, connection_1.db)("messages").where("customer_phone", customerPhone).del();
        console.log("Message deleted from PostgreSQL for:", customerPhone);
    }
    async storeManagetStatus(customerPhone, status) {
        // First ensure user exists
        await this.ensureUser(customerPhone);
        await (0, connection_1.db)("manager_status")
            .insert({
            customer_phone: customerPhone,
            manager_status: status,
        })
            .onConflict("customer_phone")
            .merge();
        console.log("Manager status stored in PostgreSQL:", {
            customerPhone,
            status,
        });
    }
    async getManagetStatus(customerPhone) {
        const result = await (0, connection_1.db)("manager_status")
            .where("customer_phone", customerPhone)
            .first();
        if (!result)
            return null;
        return {
            customerPhone: result.customer_phone,
            managerStatus: result.manager_status,
        };
    }
    async ensureUser(phone) {
        await (0, connection_1.db)("users")
            .insert({
            phone,
            customer_name: phone, // Default name
        })
            .onConflict("phone")
            .ignore();
    }
}
exports.PostgresDao = PostgresDao;
exports.default = PostgresDao;
