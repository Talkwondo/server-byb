import { Request, Response } from "express";
import { IncomingData } from "../types";
import { BybHandler } from "../clients/byb";

export const handleWebhook = async (req: Request, res: Response) => {
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

    const messages = value.messages?.[0];
    if (!messages) {
      return res.status(200).json({ message: "No messages to process" });
    }

    // Extract message data
    const businessPhone = value.metadata?.phone_number_id || "";
    const customerPhone = messages.from;
    const customerName = messages.from || "Unknown";
    const timeStamp = messages.timestamp;
    const phoneId = value.metadata?.phone_number_id || "";
    const message = messages;

    const incomingData: IncomingData = {
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
    const result = await BybHandler(incomingData);

    if (result) {
      return res.status(result.statusCode).json(JSON.parse(result.body));
    } else {
      return res.status(200).json({ message: "Message processed" });
    }
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.log("Webhook verification failed");
    res.sendStatus(403);
  }
};
