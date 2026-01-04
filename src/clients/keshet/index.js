"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeshetHandler = void 0;
const types_1 = require("../../types");
const messages_1 = require("../../services/messages");
const postgres_1 = require("../../db/postgres");
const payment_1 = require("../../services/payment");
const KeshetHandler = async ({ businessPhone, customerPhone, customerName, timeStamp, phoneId, message, }) => {
    const db = new postgres_1.PostgresDao();
    console.debug(`[Post Message Webhook BYB] received order: message.type: ${message?.type}, timeStamp: ${timeStamp}, businessPhone: ${businessPhone}, customerPhone: ${customerPhone}, customerName: ${customerName}, msg: ${JSON.stringify(message)}`);
    if (message?.type === types_1.typeOrder.TEXT) {
    }
    if (message?.type === types_1.typeOrder.ORDER) {
        const orderParsed = message.order.product_items.map((product) => {
            return `${product.title} ${product.quantity} שעות`;
        });
        let cancelOrder = false;
        for (const product of message.order.product_items) {
            const quantity = product.quantity;
            if (quantity < 8) {
                await (0, messages_1.sendTextToClient)("", customerPhone, "", phoneId, "ההזמנה חייבת להכיל 8 שעות מכל עובד במינימום");
                cancelOrder = true;
                break;
            }
        }
        if (cancelOrder)
            return;
        await (0, messages_1.sendSummaryOrderWithDetiales)(orderParsed.join("\n"), customerPhone, phoneId);
        const order = message.order;
        await db.storeMessage({
            customerPhone,
            timestamp: timeStamp,
            order: order,
            matchedItems: [],
            flowCounter: 0,
            name: "",
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "Summary Order sent to client",
            }),
        };
    }
    if (message?.type === "interactive" &&
        message.interactive?.type === "nfm_reply") {
        const delivery = {};
        const getOrder = await db.getMessage(customerPhone);
        if (!getOrder)
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: "Order not found",
                }),
            };
        const reply = JSON.parse(message.interactive.nfm_reply.response_json);
        console.log(JSON.stringify(reply));
        if (reply["name"])
            delivery.city = reply["name"];
        if (reply["vat"])
            delivery.street = reply["vat"];
        if (reply["note"])
            delivery.street = reply["note"];
        if (reply["date"])
            delivery.street = reply["date"];
        // update the db with the order placed with status pending payment...
        // send payment link to client
        try {
            const getPaymentLink = await (0, payment_1.generatePaymentLink)(getOrder.order, customerPhone);
            if (getPaymentLink.success && getPaymentLink.paymentLink) {
                const link = getPaymentLink.paymentLink.split("/").slice(-2).join("/");
                await (0, messages_1.sendLinkToPay)(getPaymentLink.orderId, link, customerPhone, businessPhone, customerName, timeStamp, phoneId);
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "Payment link sent to client" }),
            };
        }
        catch (err) {
            console.log("PAYMENT ERROR", err);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Payment processing error" }),
            };
        }
    }
};
exports.KeshetHandler = KeshetHandler;
