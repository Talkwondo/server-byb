import express from "express";
import { handleWebhook, verifyWebhook } from "./src/controllers/webhook";
import { handleFlow } from "./src/controllers/flow";
import dotenv from "dotenv";
import { handleVerifyPayment } from "./src/services/payment";

dotenv.config();

const app = express();
const port = process.env.PORT || 3980;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Flow endpoint for WhatsApp Flow handling
app.post("/flow", handleFlow);

// WhatsApp webhook endpoints
app.get("/webhook", verifyWebhook);
app.post("/webhook", handleWebhook);
app.post("/verify", handleVerifyPayment);

app.listen(port, () => {
  console.log(`WhatsApp Bot Server running at http://localhost:${port}`);
  console.log(`Webhook URL: http://localhost:${port}/webhook`);
  console.log(`Flow endpoint: http://localhost:${port}/flow`);
});
