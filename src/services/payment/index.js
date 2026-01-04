"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVerifyPayment = exports.validatePayment = exports.processPayment = exports.generatePaymentLink = void 0;
const messages_1 = require("../messages");
const PAYMENT_PROVIDER_URL = process.env.PAYMENT_PROVIDER_URL ||
    "https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl";
const PAYMENT_GROUP_TOKEN = process.env.PAYMENT_GROUP_TOKEN ||
    "6ff3d7c6-001c-48ea-a6c8-9482791c1d60";
const PAYMENT_IPN_URL = process.env.PAYMENT_IPN_URL ||
    "https://payment.horim-elcharizi.co.il/verify";
const PAYMENT_FAIL_REDIRECT_URL = process.env.PAYMENT_FAIL_REDIRECT_URL ||
    "https://horim-elcharizi.co.il/fail";
const PAYMENT_SUCCESS_REDIRECT_URL = process.env.PAYMENT_SUCCESS_REDIRECT_URL ||
    "https://horim-elcharizi.co.il/success/";
const PAYMENT_TIMEOUT_MS = 30000;
const splitCustomerName = (fullName, fallback) => {
    if (!fullName) {
        return { firstName: "Customer", lastName: fallback };
    }
    const [firstName, ...rest] = fullName.trim().split(/\s+/);
    const lastName = rest.length > 0 ? rest.join(" ") : fallback;
    return {
        firstName: firstName || "Customer",
        lastName,
    };
};
const buildPaymentItems = (order) => {
    if (!order?.product_items?.length)
        return [];
    return order.product_items.map((item, index) => ({
        UnitPrice: Number(item.item_price ?? 0),
        Quantity: Number(item.quantity ?? 1),
        Description: item.title || item.name || `Order item ${index + 1}`,
    }));
};
const generatePaymentLink = async (order, customerPhone) => {
    const orderId = `ORDER_${Date.now()}_${customerPhone}`;
    try {
        const items = buildPaymentItems(order);
        if (!items.length) {
            throw new Error("No items found in order to charge");
        }
        const { firstName, lastName } = splitCustomerName(order.nameCustomer, customerPhone);
        const dataSale = {
            GroupPrivateToken: PAYMENT_GROUP_TOKEN,
            CustomerFirstName: firstName,
            CustomerLastName: lastName,
            Items: items,
            IPNURL: PAYMENT_IPN_URL,
            FailRedirectURL: PAYMENT_FAIL_REDIRECT_URL,
            RedirectURL: PAYMENT_SUCCESS_REDIRECT_URL,
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), PAYMENT_TIMEOUT_MS);
        const response = await fetch(PAYMENT_PROVIDER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dataSale),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`Payment provider returned status ${response.status}`);
        }
        const responseData = await response.json();
        const statusToString = responseData?.Status?.toString?.() ?? "";
        const redirectURL = responseData?.URL;
        if (!redirectURL) {
            throw new Error(`Payment provider did not return a redirect URL (status: ${statusToString})`);
        }
        return {
            success: true,
            orderId,
            paymentLink: redirectURL,
            paymentRequired: true,
        };
    }
    catch (error) {
        return {
            success: false,
            orderId,
            paymentRequired: false,
            error: error instanceof Error ? error.message : "Payment processing failed",
        };
    }
};
exports.generatePaymentLink = generatePaymentLink;
const processPayment = async (order, customerPhone) => {
    const items = buildPaymentItems(order);
    const totalAmount = items.reduce((sum, item) => sum + item.UnitPrice * item.Quantity, 0);
    if (totalAmount <= 0) {
        return {
            success: true,
            orderId: `ORDER_${Date.now()}_${customerPhone}`,
            paymentRequired: false,
        };
    }
    return (0, exports.generatePaymentLink)(order, customerPhone);
};
exports.processPayment = processPayment;
const validatePayment = async (orderId) => {
    // Mock payment validation - replace with actual payment gateway validation
    return true;
};
exports.validatePayment = validatePayment;
const handleVerifyPayment = async (req, res) => {
    try {
        const payload = req.body || {};
        console.log("[PAYMENT VERIFY] incoming payload", payload);
        const { businessPhone, customerPhone, timeStamp, phoneId, orderId, } = payload;
        if (businessPhone && customerPhone && phoneId && orderId) {
            await (0, messages_1.sendSuccessToClient)(businessPhone, customerPhone, timeStamp || "", phoneId, orderId);
        }
        return res
            .status(200)
            .json({ message: "Payment verification received", orderId: orderId || null });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Payment verification failed";
        console.error("Payment verification error:", message);
        return res.status(500).json({ message });
    }
};
exports.handleVerifyPayment = handleVerifyPayment;
