import { IncomingData, ProductItem, typeOrder } from "../../types";
import {
  sendLinkToPay,
  sendSummaryOrderWithDetiales,
} from "../../services/messages";
import { PostgresDao } from "../../db/postgres";
import { generatePaymentLink, processPayment } from "../../services/payment";

export const KeshetHandler = async ({
  businessPhone,
  customerPhone,
  customerName,
  timeStamp,
  phoneId,
  message,
}: IncomingData) => {
  const db = new PostgresDao();

  console.debug(
    `[Post Message Webhook BYB] received order: message.type: ${
      message?.type
    }, timeStamp: ${timeStamp}, businessPhone: ${businessPhone}, customerPhone: ${customerPhone}, customerName: ${customerName}, msg: ${JSON.stringify(
      message
    )}`
  );

  if (message?.type === typeOrder.TEXT) {
  }

  if (message?.type === typeOrder.ORDER) {
    const orderParsed = message.order.product_items.map(
      (product: ProductItem) => {
        return `${product.name} ${product.quantity} שעות`;
      }
    );
    await sendSummaryOrderWithDetiales(
      //   orderParsed.join("\n"),
      "TEST",
      customerPhone,
      phoneId
    );
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

  if (
    message?.type === "interactive" &&
    message.interactive?.type === "nfm_reply"
  ) {
    const delivery: Record<string, string> = {};

    const getOrder = await db.getMessage(customerPhone);

    if (!getOrder)
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Order not found",
        }),
      };
    const reply: JSON = JSON.parse(message.interactive.nfm_reply.response_json);
    console.log(JSON.stringify(reply));

    if ((reply as any)["name"]) delivery.city = (reply as any)["name"];
    if ((reply as any)["vat"]) delivery.street = (reply as any)["vat"];
    if ((reply as any)["note"]) delivery.street = (reply as any)["note"];
    if ((reply as any)["date"]) delivery.street = (reply as any)["date"];

    // update the db with the order placed with status pending payment...

    // send payment link to client
    try {
      const getPaymentLink = await generatePaymentLink(
        getOrder.order,
        customerPhone
      );

      if (getPaymentLink.success && getPaymentLink.paymentLink) {
        const link = getPaymentLink.paymentLink.split("/").slice(-2).join("/");
        await sendLinkToPay(
          getPaymentLink.orderId,
          link,
          customerPhone,
          businessPhone,
          customerName,
          timeStamp,
          phoneId
        );
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Payment link sent to client" }),
      };
    } catch (err) {
      console.log("PAYMENT ERROR", err);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Payment processing error" }),
      };
    }
  }
};
