import express from "express";
import { handleWebhook, verifyWebhook } from "./src/controllers/webhook";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// WhatsApp webhook endpoints
app.get("/webhook", verifyWebhook);
app.post("/webhook", handleWebhook);

app.listen(port, () => {
  console.log(`WhatsApp Bot Server running at http://localhost:${port}`);
  console.log(`Webhook URL: http://localhost:${port}/webhook`);
});
