"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageToServer = void 0;
const sendMessageToServer = async (flowType, data, customerPhone, businessPhone, customerName, timeStamp, phoneId) => {
    // Mock implementation - replace with actual server integration
    console.log("Sending message to server:", {
        flowType,
        data,
        customerPhone,
        businessPhone,
        customerName,
        timeStamp,
        phoneId,
    });
    // Simulate server response
    return {
        orderBody: {
            dailyOrderId: `ORDER_${Date.now()}`,
            pushOrderRequest: {
                orderInfo: {
                    paymentMethod: {
                        paymentType: 1, // -1 for no payment, 1 for payment required
                        paymentLink: "https://payment.example.com/pay",
                    },
                },
            },
        },
    };
};
exports.sendMessageToServer = sendMessageToServer;
