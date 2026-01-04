"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BybHandler = void 0;
const types_1 = require("../../types");
// import { sendMessageToServer } from "../../services/server/index";
// import { FlowType } from "../../services/server/server.modal";
const messages_1 = require("../../services/messages");
const postgres_1 = require("../../db/postgres");
const manager_1 = require("../../services/manager");
const payment_1 = require("../../services/payment");
const consts_1 = require("./consts");
const BybHandler = async ({ businessPhone, customerPhone, customerName, timeStamp, phoneId, message, }) => {
    const db = new postgres_1.PostgresDao();
    const MATCHED_IDS = ["104", "105", "106"];
    const flatDataItems = [
        ...consts_1.data.options,
        ...consts_1.data.meatTypes,
        ...consts_1.data.onMeat,
        ...consts_1.data.salads,
        ...consts_1.data.drinks,
    ];
    console.debug(`[Post Message Webhook BYB] received order: message.type: ${message?.type}, timeStamp: ${timeStamp}, businessPhone: ${businessPhone}, customerPhone: ${customerPhone}, customerName: ${customerName}, msg: ${JSON.stringify(message)}`);
    if (message?.type === types_1.typeOrder.TEXT) {
        if (message.text.body.includes("שלום אני רוצה לבצע הזמנה")) {
            await (0, messages_1.sendMultiMessageCatalog)(businessPhone, customerPhone, timeStamp, phoneId, consts_1.mulitProductComponents);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "sendMultiMessageCatalog" }),
            };
        }
        else if (message.text.body === "מנהל") {
            await (0, manager_1.handleManagerRequest)(businessPhone, customerPhone, customerName, timeStamp, phoneId, message);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "handleManagerRequest " }),
            };
        }
        else if (message.text.body === "ביטול מנהל") {
            await db.storeManagetStatus(customerPhone, types_1.ManagerStatus.OFF);
            await (0, messages_1.sendTextToClient)(businessPhone, customerPhone, timeStamp, phoneId, "מצב מנהל בוטל");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "handleManagerRequest " }),
            };
        }
    }
    const isManager = await db.getManagetStatus(customerPhone);
    if (isManager?.managerStatus) {
        if (isManager?.managerStatus === types_1.ManagerStatus.ON) {
            await (0, manager_1.handleManagerRequest)(businessPhone, customerPhone, customerName, timeStamp, phoneId, message);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "sendSuspendMessage sent to client" }),
            };
        }
    }
    if (message?.type === types_1.typeOrder.ORDER) {
        const matchedItems = [];
        const nameMap = new Map(consts_1.names.map((n) => [n.id, n.name]));
        const namedOrderItems = message.order.product_items.map((item) => {
            const name = nameMap.get(item.product_retailer_id) || "";
            return {
                ...item,
                name,
            };
        });
        message.order.product_items = namedOrderItems;
        for (const item of message.order.product_items) {
            if (MATCHED_IDS.includes(item.product_retailer_id)) {
                const nameProduct = item.name || "";
                for (let i = 0; i < item.quantity; i++) {
                    matchedItems.push({
                        product_retailer_id: item.product_retailer_id,
                        name: nameProduct,
                        quantity: 1,
                    });
                }
            }
        }
        const nameProduct = message.order.product_items[0]?.name || "";
        await db.storeMessage({
            customerPhone,
            timestamp: timeStamp,
            order: message.order,
            matchedItems,
            name: nameProduct,
            flowCounter: 0,
        });
        if (matchedItems.length > 0) {
            const firstMatchId = matchedItems[0].product_retailer_id;
            await (0, messages_1.sendAddsToClient)(businessPhone, // from
            customerPhone, // to
            timeStamp, // timestamp
            phoneId, // phoneId
            nameProduct, // name
            consts_1.flowDataMap[firstMatchId] || consts_1.flowDataMap.default, // flowActions
            undefined // link (optional)
            );
        }
        else {
            await (0, messages_1.sendSummaryOrderToClient)(businessPhone, customerPhone, timeStamp, phoneId, []);
        }
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: "First flow sent to client",
            }),
        };
    }
    if (message?.type === "interactive" &&
        message.interactive?.type === "nfm_reply") {
        const reply = JSON.parse(message.interactive.nfm_reply.response_json);
        console.log(JSON.stringify(reply));
        const getOrder = await db.getMessage(customerPhone);
        let finishSummary = false;
        if (getOrder?.order) {
            const currentIndex = getOrder.flowCounter || 0;
            const matchedItems = getOrder.matchedItems;
            const allProductItems = getOrder.order.product_items || [];
            const currentMatched = matchedItems?.[currentIndex] || allProductItems?.[currentIndex];
            if (!currentMatched || !currentMatched.product_retailer_id) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: "No valid product at current index",
                    }),
                };
            }
            const currency = allProductItems[0]?.currency || "₪";
            const add_ons = [];
            const sub_items = [];
            const delivery = {};
            const nameCustomer = reply["name_order"];
            const noteOrder = reply["note_order"];
            const takeawayRaw = reply["takeaway_order"];
            let dispatchType = types_1.OrderTypeDispatch.SITTING;
            if (takeawayRaw === "001") {
                dispatchType = types_1.OrderTypeDispatch.SITTING;
            }
            else if (takeawayRaw === "002" || !takeawayRaw) {
                dispatchType = types_1.OrderTypeDispatch.TAKEAWAY;
            }
            else {
                dispatchType = types_1.OrderTypeDispatch.DELIVERY;
            }
            for (const [key, val] of Object.entries(reply)) {
                if (key === "flow_token") {
                    if (val === "summary") {
                        finishSummary = true;
                        break;
                    }
                    continue;
                }
                if (["note_order", "takeaway_order", "name_order"].includes(key)) {
                    continue;
                }
                const values = Array.isArray(val) ? val : [val];
                for (const value of values) {
                    const match = flatDataItems.find((item) => item.id === value);
                    const productItem = {
                        product_retailer_id: value,
                        quantity: 1,
                        item_price: 0,
                        currency,
                        title: consts_1.TitlesFlow[key],
                        name: match?.title,
                    };
                    if (key === "note") {
                        productItem.note = val;
                    }
                    if (key === "salad" || key === "drink") {
                        sub_items.push(productItem);
                    }
                    else {
                        add_ons.push(productItem);
                    }
                }
            }
            // Delivery
            if (reply["city"])
                delivery.city = reply["city"];
            if (reply["street"])
                delivery.street = reply["street"];
            if (reply["house"])
                delivery.house_number = reply["house"];
            if (reply["floor"])
                delivery.floor = reply["floor"];
            if (reply["apartment"])
                delivery.apartment = reply["apartment"];
            if (reply["delivery_date"])
                delivery.delivery_date = reply["delivery_date"];
            if (reply["delivery_hour"])
                delivery.delivery_hour = reply["delivery_hour"];
            getOrder.order.delivery = delivery;
            if (noteOrder)
                getOrder.order.note = noteOrder;
            if (nameCustomer)
                getOrder.order.nameCustomer = nameCustomer;
            if (dispatchType !== null)
                getOrder.order.orderType = dispatchType;
            if (!finishSummary) {
                const existingItem = allProductItems.find((item) => item?.product_retailer_id === currentMatched.product_retailer_id);
                const baseProductItem = {
                    product_retailer_id: currentMatched.product_retailer_id,
                    quantity: 1,
                    item_price: existingItem?.item_price || 0,
                    currency,
                    add_ons,
                    sub_items,
                    name: consts_1.names.find((n) => n.id === currentMatched.product_retailer_id)
                        ?.name,
                };
                getOrder.order.product_items = allProductItems.filter((item) => {
                    const isSameProduct = item.product_retailer_id === currentMatched.product_retailer_id;
                    const hasCustomizations = (item.add_ons && item.add_ons.length > 0) ||
                        (item.sub_items && item.sub_items.length > 0);
                    return !isSameProduct || hasCustomizations;
                });
                getOrder.order.product_items.push({ ...baseProductItem, quantity: 1 });
                const nextCounter = currentIndex + 1;
                const itemList = matchedItems || allProductItems;
                const allDone = nextCounter >= itemList.length;
                if (allDone) {
                    if (!finishSummary) {
                        await db.storeMessage({
                            customerPhone,
                            timestamp: timeStamp,
                            order: getOrder.order,
                            matchedItems: matchedItems,
                            flowCounter: currentIndex,
                            name: "",
                        });
                        await (0, messages_1.sendSummaryOrderToClient)(businessPhone, customerPhone, timeStamp, phoneId, []);
                        return {
                            statusCode: 200,
                            body: JSON.stringify({ message: "Payment sent to client" }),
                        };
                    }
                    try {
                        // Process payment using payment service
                        const paymentResult = await (0, payment_1.processPayment)(getOrder.order, customerPhone);
                        if (!paymentResult.success) {
                            throw new Error(paymentResult.error || "Payment processing failed");
                        }
                        if (!paymentResult.paymentRequired) {
                            await (0, messages_1.sendSuccessToClient)(businessPhone, customerPhone, timeStamp, phoneId, paymentResult.orderId);
                            await db.deleteMessage(customerPhone);
                            return {
                                statusCode: 200,
                                body: JSON.stringify({
                                    message: "Order completed successfully",
                                }),
                            };
                        }
                        if (paymentResult.paymentLink) {
                            const link = paymentResult.paymentLink
                                .split("/")
                                .slice(-2)
                                .join("/");
                            await (0, messages_1.sendLinkToPay)(paymentResult.orderId, link, customerPhone, businessPhone, customerName, timeStamp, phoneId);
                            return {
                                statusCode: 200,
                                body: JSON.stringify({
                                    message: "Payment link sent to client",
                                }),
                            };
                        }
                    }
                    catch (err) {
                        console.log("PAYMENT ERROR", err);
                        return {
                            statusCode: 500,
                            body: JSON.stringify({ message: "Payment processing error" }),
                        };
                    }
                }
                else {
                    await db.storeMessage({
                        customerPhone,
                        timestamp: timeStamp,
                        order: getOrder.order,
                        matchedItems: matchedItems,
                        flowCounter: nextCounter,
                        name: "",
                    });
                    const nextMatched = itemList[nextCounter];
                    await (0, messages_1.sendAddsToClient)(businessPhone, customerPhone, timeStamp, phoneId, `${nextMatched.name} מנה ${nextCounter + 1}`, consts_1.flowDataMap[nextMatched.product_retailer_id] || consts_1.flowDataMap.default);
                    return {
                        statusCode: 200,
                        body: JSON.stringify({ message: "Next flow step sent" }),
                    };
                }
            }
        }
    }
};
exports.BybHandler = BybHandler;
