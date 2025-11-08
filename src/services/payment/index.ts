import { Order } from "../../types";
import { sendSuccessToClient } from "../messages";

export interface PaymentResult {
  success: boolean;
  orderId: string;
  paymentRequired: boolean;
  paymentLink?: string;
  error?: string;
}

export const generatePaymentLink = async (
  order: Order,
  customerPhone: string
): Promise<PaymentResult> => {
  try {
    const orderId = `ORDER_${Date.now()}_${customerPhone}`;
    const paymentLink = `https://payment.example.com/pay/${orderId}`;
    return {
      success: true,
      orderId,
      paymentLink,
      paymentRequired: true,
    };
  } catch (error) {
    return {
      success: false,
      orderId: "",
      paymentRequired: false,
      error:
        error instanceof Error ? error.message : "Payment processing failed",
    };
  }
};
export const processPayment = async (
  order: Order,
  customerPhone: string
): Promise<PaymentResult> => {
  try {
    // Generate order ID
    const orderId = `ORDER_${Date.now()}_${customerPhone}`;

    // Mock payment processing - replace with actual payment gateway integration
    const paymentRequired = true; // Set to false for free orders
    const paymentLink = paymentRequired
      ? `https://payment.example.com/pay/${orderId}`
      : undefined;

    return {
      success: true,
      orderId,
      paymentRequired,
      paymentLink,
    };
  } catch (error) {
    return {
      success: false,
      orderId: "",
      paymentRequired: false,
      error:
        error instanceof Error ? error.message : "Payment processing failed",
    };
  }
};

export const validatePayment = async (orderId: string): Promise<boolean> => {
  // Mock payment validation - replace with actual payment gateway validation
  return true;
};

export const handleVerifyPayment = async (req: any) => {
  const {
    businessPhone,
    customerPhone,
    timeStamp,
    phoneId,
    orderId,
  }: {
    businessPhone: string;
    customerPhone: string;
    timeStamp: string;
    phoneId: string;
    orderId: string;
  } = await req.json();
  //send Success message to client
  await sendSuccessToClient(
    businessPhone,
    customerPhone,
    timeStamp,
    phoneId,
    orderId
  );
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Payment verified successfully" }),
  };
};
