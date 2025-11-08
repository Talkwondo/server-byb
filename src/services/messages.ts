import { IncomingData, Order } from "../types";
import moment from "moment";

interface WhatsappFlow {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: string;
      parameters?: Array<{
        type: string;
        image?: {
          link: string;
        };
        text?: string;
        action?: {
          flow_token: string;
          flow_action_data?: any;
        };
      }>;
      sub_type?: string;
      index?: string;
    }>;
  };
}

const sendMessage = async (
  data: WhatsappFlow,
  from: string,
  to: string,
  timestamp: string,
  phoneId: string
) => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneId}/messages`,
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
    console.log("Message sent successfully:", result);
    return result;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

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
  from: string,
  to: string,
  timestamp: string,
  phoneId: string,
  name: string,
  flowActions: any,
  link?: string
) => {
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
    const response = await sendMessage(
      data as WhatsappFlow,
      from,
      to,
      timestamp,
      phoneId
    );
    return response;
  } catch (err) {
    console.error("Error sending adds client message:", err);
    return null;
  }
};

export const sendSummaryOrderWithDetiales = async (
  order: string,
  to: string
) => {
  const today = moment().format("YYYY-MM-DD");

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
        text: "הכינו פרטי מזמין",
      },
      action: {
        name: "flow",
        parameters: {
          flow_action_payload: {
            screen: "DELIVERY",
            data: {
              min_date: today,
              order,
            },
          },
        },
      },
    },
  };
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

// TODO: Define this schema/config as a TypeScript constant or interface if used as config/data.
// Example (fixed JSON to valid TS and moved to export):

export const orderSummaryScreenConfig = {
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
