"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhook = exports.handleWebhook = void 0;
const keshet_1 = require("../clients/keshet");
const handleWebhook = async (req, res) => {
    try {
        const { body } = req;
        // Extract webhook data
        const entry = body.entry?.[0];
        if (!entry) {
            return res.status(400).json({ error: "No entry found in webhook" });
        }
        const changes = entry.changes?.[0];
        if (!changes) {
            return res.status(400).json({ error: "No changes found in entry" });
        }
        const value = changes.value;
        if (!value) {
            return res.status(400).json({ error: "No value found in changes" });
        }
        // Filter out old messages (> 12 minutes) to prevent duplicate processing
        // Meta retries failed webhooks with the same timestamp
        if (value.messages) {
            const twelveMinutesAgo = (Date.now() - 1000 * 60 * 12) / 1000; // Convert to seconds
            value.messages = value.messages.filter((message) => message.timestamp > twelveMinutesAgo);
            console.log(`Filtered messages. Remaining: ${value.messages.length}`);
        }
        const messages = value.messages?.[0];
        if (!messages) {
            return res.status(200).json({
                message: "No messages to process (filtered out old messages)",
            });
        }
        // Extract message data
        const businessPhone = value.metadata?.phone_number_id || "";
        const customerPhone = messages.from;
        const customerName = messages.from || "Unknown";
        const timeStamp = messages.timestamp;
        const phoneId = value.metadata?.phone_number_id || "";
        const message = messages;
        const incomingData = {
            businessPhone,
            customerPhone,
            customerName,
            timeStamp: timeStamp.toString(),
            phoneId,
            message,
        };
        console.log("Webhook received:", {
            businessPhone,
            customerPhone,
            customerName,
            timeStamp,
            phoneId,
            messageType: message.type,
        });
        // Route to appropriate client handler based on business phone or other criteria
        // For now, route all to BYB handler
        // const result = await BybHandler(incomingData);
        const result = await (0, keshet_1.KeshetHandler)(incomingData);
        // Always return 200 to Meta to acknowledge webhook receipt
        // Meta only cares that the webhook was received, not business logic success
        if (result) {
            console.log("Handler result:", JSON.parse(result.body));
            return res
                .status(200)
                .json({ message: "Webhook processed successfully" });
        }
        else {
            return res.status(200).json({ message: "Message processed" });
        }
    }
    catch (error) {
        console.error("Webhook error:", error);
        // Even on error, return 200 to Meta to prevent retries
        return res.status(200).json({ message: "Webhook received with errors" });
    }
};
exports.handleWebhook = handleWebhook;
const verifyWebhook = (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    console.log("verifyToken", process.env.WHATSAPP_VERIFY_TOKEN);
    console.log("token", token);
    console.log("mode", mode);
    console.log("challenge", challenge);
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode === "subscribe" && token === verifyToken) {
        console.log("Webhook verified successfully");
        res.status(200).send(challenge);
    }
    else {
        console.log("Webhook verification failed");
        res.sendStatus(403);
    }
};
exports.verifyWebhook = verifyWebhook;
