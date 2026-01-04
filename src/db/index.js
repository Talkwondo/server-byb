"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresDao = void 0;
class MessageDao {
    constructor() {
        this.messages = new Map();
        this.managerStatus = new Map();
    }
    async storeMessage(data) {
        this.messages.set(data.customerPhone, data);
        console.log("Message stored:", data);
    }
    async getMessage(customerPhone) {
        return this.messages.get(customerPhone) || null;
    }
    async deleteMessage(customerPhone) {
        this.messages.delete(customerPhone);
        console.log("Message deleted for:", customerPhone);
    }
    async storeManagetStatus(customerPhone, status) {
        this.managerStatus.set(customerPhone, {
            customerPhone,
            managerStatus: status,
        });
        console.log("Manager status stored:", { customerPhone, status });
    }
    async getManagetStatus(customerPhone) {
        return this.managerStatus.get(customerPhone) || null;
    }
}
exports.PostgresDao = MessageDao;
