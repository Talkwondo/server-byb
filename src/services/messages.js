"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderSummaryScreenConfig = exports.sendLinkToPay = exports.sendSuccessToClient = exports.sendSummaryOrderToClient = exports.sendSummaryOrderWithDetiales = exports.sendAddsToClient = exports.sendMultiMessageCatalog = exports.sendTextToClient = void 0;
const moment_1 = __importDefault(require("moment"));
const sendMessage = async (data, from, to, timestamp, phoneId) => {
    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Message sent successfully:", result);
        return result;
    }
    catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};
const sendTextToClient = async (businessPhone, customerPhone, timeStamp, phoneId, text) => {
    const messageData = {
        messaging_product: "whatsapp",
        to: customerPhone,
        type: "text",
        text: { body: text },
    };
    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messageData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Message sent successfully:", result);
        return result;
    }
    catch (error) {
        console.error("Error sending text message:", error);
        throw error;
    }
};
exports.sendTextToClient = sendTextToClient;
const sendMultiMessageCatalog = async (businessPhone, customerPhone, timeStamp, phoneId, components) => {
    const messageData = {
        messaging_product: "whatsapp",
        to: customerPhone,
        type: "interactive",
        interactive: {
            type: "product_list",
            body: {
                text: "ברוכים הבאים! בחרו מהתפריט שלנו:",
            },
            action: {
                catalog_id: process.env.CATALOG_ID,
                product_retailer_id: "104",
            },
        },
    };
    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messageData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Catalog message sent successfully:", result);
        return result;
    }
    catch (error) {
        console.error("Error sending catalog message:", error);
        throw error;
    }
};
exports.sendMultiMessageCatalog = sendMultiMessageCatalog;
const sendAddsToClient = async (from, to, timestamp, phoneId, name, flowActions, link) => {
    const data = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
            name: "add_ons",
            language: {
                code: "he",
            },
            components: [
                {
                    type: "header",
                    parameters: [
                        {
                            type: "image",
                            image: {
                                link: "https://d25t2285lxl5rf.cloudfront.net/images/dishes/8c8e58ae-a5e5-45fd-b283-429b1eec107d.jpg",
                            },
                        },
                    ],
                },
                {
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: name,
                        },
                    ],
                },
                {
                    type: "button",
                    sub_type: "flow",
                    index: "0",
                    parameters: [
                        {
                            // old way
                            type: "action",
                            action: {
                                flow_token: "kmknrnje",
                                flow_action_data: flowActions,
                            },
                        },
                        // { // with loading data on first screen
                        //   type: "action",
                        //   action: {
                        //     flow_token: "kmknrnje",
                        //   },
                        // },
                    ],
                },
            ],
        },
    };
    try {
        const response = await sendMessage(data, from, to, timestamp, phoneId);
        return response;
    }
    catch (err) {
        console.error("Error sending adds client message:", err);
        return null;
    }
};
exports.sendAddsToClient = sendAddsToClient;
const sendSummaryOrderWithDetiales = async (order, to, phoneId) => {
    const today = (0, moment_1.default)().format("YYYY-MM-DD");
    const data = {
        recipient_type: "individual",
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
            name: "summary",
            language: {
                code: "he",
            },
            components: [
                {
                    type: "button",
                    sub_type: "flow",
                    index: "0",
                    parameters: [
                        {
                            // old way
                            type: "action",
                            action: {
                                flow_token: "kmknrnjefsfew",
                                flow_action_data: {
                                    min_date: today,
                                    order,
                                },
                            },
                        },
                        // { // with loading data on first screen
                        //   type: "action",
                        //   action: {
                        //     flow_token: "kmknrnje",
                        //   },
                        // },
                    ],
                },
            ],
        },
    };
    console.log("DATA", data);
    try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Summary message sent successfully:", result);
        return result;
    }
    catch (error) {
        console.error("Error sending summary message:", error);
        throw error;
    }
};
exports.sendSummaryOrderWithDetiales = sendSummaryOrderWithDetiales;
const sendSummaryOrderToClient = async (from, to, timestamp, phoneId, flowActions, delivery = false) => {
    const data = {
        recipient_type: "individual",
        messaging_product: "whatsapp",
        to,
        type: "interactive",
        interactive: {
            type: "flow",
            header: {
                type: "text",
                text: "סיכום הזמנה",
            },
            body: {
                text: "אנא סכמו את הזמנכם",
            },
            footer: {
                text: delivery ? "הכינו פרטי משלוח" : "הכינו פרטי איסוף",
            },
            action: {
                name: "flow",
                parameters: {
                    flow_message_version: "3",
                    flow_token: "AQAAAAACS5FpgQ_cAAAAAD0QI3s.",
                    flow_id: "2525252361195121",
                    flow_cta: "סיכום הזמנה",
                    flow_action: "navigate",
                    flow_action_payload: {
                        screen: "DELIVERY",
                        data: {
                            ...flowActions,
                            delivery,
                            min_date: "2025-07-10",
                            max_date: "2025-07-12",
                        },
                    },
                },
            },
        },
    };
    try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Summary message sent successfully:", result);
        return result;
    }
    catch (error) {
        console.error("Error sending summary message:", error);
        throw error;
    }
};
exports.sendSummaryOrderToClient = sendSummaryOrderToClient;
const sendSuccessToClient = async (businessPhone, customerPhone, timeStamp, phoneId, orderId) => {
    const messageData = {
        messaging_product: "whatsapp",
        to: customerPhone,
        type: "text",
        text: {
            body: `תודה! הזמנתכם התקבלה בהצלחה. מספר הזמנה: ${orderId}`,
        },
    };
    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messageData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Success message sent successfully:", result);
        return result;
    }
    catch (error) {
        console.error("Error sending success message:", error);
        throw error;
    }
};
exports.sendSuccessToClient = sendSuccessToClient;
const sendLinkToPay = async (orderId, paymentLink, customerPhone, businessPhone, customerName, timeStamp, phoneId) => {
    const messageData = {
        messaging_product: "whatsapp",
        to: customerPhone,
        type: "text",
        text: {
            body: `להשלמת הזמנתכם, אנא לחצו על הקישור לתשלום: ${paymentLink}`,
        },
    };
    try {
        const response = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messageData),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log("Payment link sent successfully:", result);
        return result;
    }
    catch (error) {
        console.error("Error sending payment link:", error);
        throw error;
    }
};
exports.sendLinkToPay = sendLinkToPay;
// TODO: Define this schema/config as a TypeScript constant or interface if used as config/data.
// Example (fixed JSON to valid TS and moved to export):
exports.orderSummaryScreenConfig = {
    screens: [
        {
            data: {},
            id: "RECOMMEND",
            layout: {
                children: [
                    {
                        children: [
                            { text: "להלן הזמנתך", type: "TextSubheading" },
                            { text: "מנקה 8 שעות", type: "TextBody" },
                            {
                                "input-type": "text",
                                label: "פרטי חברת המזמין",
                                name: "___193abd",
                                required: true,
                                type: "TextInput",
                            },
                            {
                                "input-type": "text",
                                label: "ח.פ",
                                name: "_8c7f65",
                                required: true,
                                type: "TextInput",
                            },
                            {
                                label: "תאריך מתבקש",
                                name: "__f726e9",
                                required: true,
                                type: "DatePicker",
                                "helper-text": "בחר תאריך",
                            },
                            {
                                type: "TextArea",
                                label: "הערות",
                                required: false,
                                name: "_0d3fe3",
                            },
                            {
                                label: "שלח הזמנה",
                                "on-click-action": {
                                    name: "complete",
                                    payload: {
                                        screen_0____0: "${form.___193abd}",
                                        screen_0__1: "${form._8c7f65}",
                                        screen_0___2: "${form.__f726e9}",
                                        screen_0__3: "${form._0d3fe3}",
                                    },
                                },
                                type: "Footer",
                            },
                        ],
                        name: "flow_path",
                        type: "Form",
                    },
                ],
                type: "SingleColumnLayout",
            },
            terminal: true,
            title: "סיכום הזמנה",
        },
    ],
    version: "7.2",
};
