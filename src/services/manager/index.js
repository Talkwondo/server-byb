"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleManagerRequest = void 0;
const messages_1 = require("../messages");
const handleManagerRequest = async (businessPhone, customerPhone, customerName, timeStamp, phoneId, message) => {
    console.log("Handling manager request:", {
        businessPhone,
        customerPhone,
        customerName,
        timeStamp,
        phoneId,
        message,
    });
    // Send manager mode activated message
    await (0, messages_1.sendTextToClient)(businessPhone, customerPhone, timeStamp, phoneId, "מצב מנהל מופעל. כל ההודעות יועברו למנהל.");
    // Here you would typically forward the message to a manager
    // or store it for manager review
    console.log("Manager mode activated for customer:", customerPhone);
};
exports.handleManagerRequest = handleManagerRequest;
