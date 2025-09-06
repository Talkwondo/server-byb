import {
  IncomingData,
  ManagerStatus,
  typeOrder,
  OrderTypeDispatch,
  OrderResponse,
  MatchedItem,
} from "../../types";
// import { sendMessageToServer } from "../../services/server/index";
// import { FlowType } from "../../services/server/server.modal";
import {
  sendMultiMessageCatalog,
  sendSuccessToClient,
  sendLinkToPay,
  sendAddsToClient,
  sendTextToClient,
  sendSummaryOrderToClient,
} from "../../services/messages";
import { ProductItem, Order } from "../../types";
import { PostgresDao } from "../../db/postgres";
import { handleManagerRequest } from "../../services/manager";
import { processPayment } from "../../services/payment";
import {
  names,
  data,
  TitlesFlow,
  flowDataMap,
  mulitProductComponents,
} from "./consts";

export const BybHandler = async ({
  businessPhone,
  customerPhone,
  customerName,
  timeStamp,
  phoneId,
  message,
}: IncomingData) => {
  const db = new PostgresDao();
  const MATCHED_IDS = ["104", "105", "106"];

  const flatDataItems = [
    ...data.options,
    ...data.meatTypes,
    ...data.onMeat,
    ...data.salads,
    ...data.drinks,
  ];

  console.debug(
    `[Post Message Webhook BYB] received order: message.type: ${
      message?.type
    }, timeStamp: ${timeStamp}, businessPhone: ${businessPhone}, customerPhone: ${customerPhone}, customerName: ${customerName}, msg: ${JSON.stringify(
      message
    )}`
  );

  if (message?.type === typeOrder.TEXT) {
    if (message.text.body.includes("שלום אני רוצה לבצע הזמנה")) {
      await sendMultiMessageCatalog(
        businessPhone,
        customerPhone,
        timeStamp,
        phoneId,
        mulitProductComponents
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "sendMultiMessageCatalog" }),
      };
    } else if (message.text.body === "מנהל") {
      await handleManagerRequest(
        businessPhone,
        customerPhone,
        customerName,
        timeStamp,
        phoneId,
        message
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "handleManagerRequest " }),
      };
    } else if (message.text.body === "ביטול מנהל") {
      await db.storeManagetStatus(customerPhone, ManagerStatus.OFF);
      await sendTextToClient(
        businessPhone,
        customerPhone,
        timeStamp,
        phoneId,
        "מצב מנהל בוטל"
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "handleManagerRequest " }),
      };
    }
  }

  const isManager = await db.getManagetStatus(customerPhone);
  if (isManager?.managerStatus) {
    if (isManager?.managerStatus === ManagerStatus.ON) {
      await handleManagerRequest(
        businessPhone,
        customerPhone,
        customerName,
        timeStamp,
        phoneId,
        message
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "sendSuspendMessage sent to client" }),
      };
    }
  }

  if (message?.type === typeOrder.ORDER) {
    const matchedItems: MatchedItem[] = [];
    const nameMap = new Map(names.map((n) => [n.id, n.name]));

    const namedOrderItems: ProductItem[] = message.order.product_items.map(
      (item: { product_retailer_id: string }) => {
        const name = nameMap.get(item.product_retailer_id) || "";
        return {
          ...item,
          name,
        };
      }
    );

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

      await sendAddsToClient(
        businessPhone,
        customerPhone,
        timeStamp,
        phoneId,
        nameProduct,
        flowDataMap[firstMatchId] || flowDataMap.default
      );
    } else {
      await sendSummaryOrderToClient(
        businessPhone,
        customerPhone,
        timeStamp,
        phoneId,
        []
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "First flow sent to client",
      }),
    };
  }

  if (
    message?.type === "interactive" &&
    message.interactive?.type === "nfm_reply"
  ) {
    const reply: JSON = JSON.parse(message.interactive.nfm_reply.response_json);
    console.log(JSON.stringify(reply));
    const getOrder = await db.getMessage(customerPhone);
    let finishSummary = false;

    if (getOrder?.order) {
      const currentIndex = getOrder.flowCounter || 0;

      const matchedItems = getOrder.matchedItems;
      const allProductItems = getOrder.order.product_items || [];

      const currentMatched =
        matchedItems?.[currentIndex] || allProductItems?.[currentIndex];
      if (!currentMatched || !currentMatched.product_retailer_id) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: "No valid product at current index",
          }),
        };
      }

      const currency = allProductItems[0]?.currency || "₪";
      const add_ons: ProductItem[] = [];
      const sub_items: ProductItem[] = [];
      const delivery: Record<string, string> = {};

      const nameCustomer = (reply as any)["name_order"] as string;
      const noteOrder = (reply as any)["note_order"] as string;
      const takeawayRaw = (reply as any)["takeaway_order"] as string;

      let dispatchType: string = OrderTypeDispatch.SITTING;

      if (takeawayRaw === "001") {
        dispatchType = OrderTypeDispatch.SITTING;
      } else if (takeawayRaw === "002" || !takeawayRaw) {
        dispatchType = OrderTypeDispatch.TAKEAWAY;
      } else {
        dispatchType = OrderTypeDispatch.DELIVERY;
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
          const productItem: ProductItem = {
            product_retailer_id: value as string,
            quantity: 1,
            item_price: 0,
            currency,
            title: TitlesFlow[key as keyof typeof TitlesFlow],
            name: match?.title,
          };
          if (key === "note") {
            (productItem as any).note = val;
          }
          if (key === "salad" || key === "drink") {
            sub_items.push(productItem);
          } else {
            add_ons.push(productItem);
          }
        }
      }

      // Delivery
      if ((reply as any)["city"]) delivery.city = (reply as any)["city"];
      if ((reply as any)["street"]) delivery.street = (reply as any)["street"];
      if ((reply as any)["house"])
        delivery.house_number = (reply as any)["house"];
      if ((reply as any)["floor"]) delivery.floor = (reply as any)["floor"];
      if ((reply as any)["apartment"])
        delivery.apartment = (reply as any)["apartment"];
      if ((reply as any)["delivery_date"])
        delivery.delivery_date = (reply as any)["delivery_date"];
      if ((reply as any)["delivery_hour"])
        delivery.delivery_hour = (reply as any)["delivery_hour"];

      getOrder.order.delivery = delivery;

      if (noteOrder) getOrder.order.note = noteOrder;
      if (nameCustomer) getOrder.order.nameCustomer = nameCustomer;
      if (dispatchType !== null) getOrder.order.orderType = dispatchType;

      if (!finishSummary) {
        const existingItem = allProductItems.find(
          (item) =>
            item?.product_retailer_id === currentMatched.product_retailer_id
        );

        const baseProductItem: ProductItem = {
          product_retailer_id: currentMatched.product_retailer_id,
          quantity: 1,
          item_price: existingItem?.item_price || 0,
          currency,
          add_ons,
          sub_items,
          name: names.find((n) => n.id === currentMatched.product_retailer_id)
            ?.name,
        };

        getOrder.order.product_items = allProductItems.filter((item) => {
          const isSameProduct =
            item.product_retailer_id === currentMatched.product_retailer_id;
          const hasCustomizations =
            (item.add_ons && item.add_ons.length > 0) ||
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
            await sendSummaryOrderToClient(
              businessPhone,
              customerPhone,
              timeStamp,
              phoneId,
              []
            );
            return {
              statusCode: 200,
              body: JSON.stringify({ message: "Payment sent to client" }),
            };
          }
          try {
            // Process payment using payment service
            const paymentResult = await processPayment(
              getOrder.order,
              customerPhone
            );

            if (!paymentResult.success) {
              throw new Error(
                paymentResult.error || "Payment processing failed"
              );
            }

            if (!paymentResult.paymentRequired) {
              await sendSuccessToClient(
                businessPhone,
                customerPhone,
                timeStamp,
                phoneId,
                paymentResult.orderId
              );
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
              await sendLinkToPay(
                paymentResult.orderId,
                link,
                customerPhone,
                businessPhone,
                customerName,
                timeStamp,
                phoneId
              );
              return {
                statusCode: 200,
                body: JSON.stringify({
                  message: "Payment link sent to client",
                }),
              };
            }
          } catch (err) {
            console.log("PAYMENT ERROR", err);
            return {
              statusCode: 500,
              body: JSON.stringify({ message: "Payment processing error" }),
            };
          }
        } else {
          await db.storeMessage({
            customerPhone,
            timestamp: timeStamp,
            order: getOrder.order,
            matchedItems: matchedItems,
            flowCounter: nextCounter,
            name: "",
          });

          const nextMatched = itemList[nextCounter];
          await sendAddsToClient(
            businessPhone,
            customerPhone,
            timeStamp,
            phoneId,
            `${nextMatched.name} מנה ${nextCounter + 1}`,
            flowDataMap[nextMatched.product_retailer_id] || flowDataMap.default
          );

          return {
            statusCode: 200,
            body: JSON.stringify({ message: "Next flow step sent" }),
          };
        }
      }
    }
  }
};
