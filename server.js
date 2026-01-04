"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhook_1 = require("./src/controllers/webhook");
const flow_1 = require("./src/controllers/flow");
const dotenv_1 = __importDefault(require("dotenv"));
const payment_1 = require("./src/services/payment");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3980;
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.json());
// Health check endpoint
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
// Flow endpoint for WhatsApp Flow handling
app.post("/flow", flow_1.handleFlow);
// WhatsApp webhook endpoints
app.get("/webhook", webhook_1.verifyWebhook);
app.post("/webhook", webhook_1.handleWebhook);
app.post("/verify", payment_1.handleVerifyPayment);
app.listen(port, () => {
    console.log(`WhatsApp Bot Server running at http://localhost:${port}`);
    console.log(`Webhook URL: http://localhost:${port}/webhook`);
    console.log(`Flow endpoint: http://localhost:${port}/flow`);
});
