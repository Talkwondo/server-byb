import { FlowType } from "./server.modal";
import { Order } from "../../types";

export interface OrderResponse {
  orderBody: {
    dailyOrderId: string;
    pushOrderRequest: {
      orderInfo: {
        paymentMethod: {
          paymentType: number;
          paymentLink: string;
        };
      };
    };
  };
}

export const sendMessageToServer = async (
  flowType: FlowType,
  data: { order: Order },
  customerPhone: string,
  businessPhone: string,
  customerName: string,
  timeStamp: string,
  phoneId: string
): Promise<OrderResponse> => {
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
