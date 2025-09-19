import { IncomingData } from "../types";

export const sendTextToClient = async (
  businessPhone: string,
  customerPhone: string,
  timeStamp: string,
  phoneId: string,
  text: string
) => {
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "text",
    text: { body: text },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Message sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending text message:", error);
    throw error;
  }
};

export const sendMultiMessageCatalog = async (
  businessPhone: string,
  customerPhone: string,
  timeStamp: string,
  phoneId: string,
  components: any[]
) => {
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
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Catalog message sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending catalog message:", error);
    throw error;
  }
};

export const sendAddsToClient = async (
  businessPhone: string,
  customerPhone: string,
  timeStamp: string,
  phoneId: string,
  productName: string,
  flowData: any
) => {
  // Import dynamic flow service
  const { dynamicFlowService } = await import("./flow");

  // Create dynamic flow for this product
  const flow = await dynamicFlowService.createFlow(
    customerPhone,
    flowData.flow_type || "default",
    { productName, ...flowData }
  );

  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "interactive",
    interactive: {
      type: "flow",
      body: {
        text: `איך תרצו את ה${productName}?`,
      },
      action: {
        name: "flow",
        parameters: {
          flow_token: flow.flowToken,
        },
        ...flowData,
      },
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Flow message sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending flow message:", error);
    throw error;
  }
};

export const sendSummaryOrderToClient = async (
  from: string,
  to: string,
  timestamp: string,
  phoneId: string,
  flowActions: any,
  delivery = false
) => {
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
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Summary message sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending summary message:", error);
    throw error;
  }
};

export const sendSuccessToClient = async (
  businessPhone: string,
  customerPhone: string,
  timeStamp: string,
  phoneId: string,
  orderId: string
) => {
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "text",
    text: {
      body: `תודה! הזמנתכם התקבלה בהצלחה. מספר הזמנה: ${orderId}`,
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Success message sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending success message:", error);
    throw error;
  }
};

export const sendLinkToPay = async (
  orderId: string,
  paymentLink: string,
  customerPhone: string,
  businessPhone: string,
  customerName: string,
  timeStamp: string,
  phoneId: string
) => {
  const messageData = {
    messaging_product: "whatsapp",
    to: customerPhone,
    type: "text",
    text: {
      body: `להשלמת הזמנתכם, אנא לחצו על הקישור לתשלום: ${paymentLink}`,
    },
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Payment link sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending payment link:", error);
    throw error;
  }
};
