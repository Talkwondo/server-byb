import { Request, Response } from "express";
import { Order } from "../../types";
import { sendSuccessToClient } from "../messages";

const PAYMENT_PROVIDER_URL =
  process.env.PAYMENT_PROVIDER_URL ||
  "https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc/GetUrl";
const PAYMENT_GROUP_TOKEN =
  process.env.PAYMENT_GROUP_TOKEN ||
  "bb8a47ab-42e0-4b7f-ba08-72d55f2d9e41";
const PAYMENT_IPN_URL =
  process.env.PAYMENT_IPN_URL ||
  "https://payment.horim-elcharizi.co.il/verify";
const PAYMENT_FAIL_REDIRECT_URL =
  process.env.PAYMENT_FAIL_REDIRECT_URL ||
  "https://horim-elcharizi.co.il/fail";
const PAYMENT_SUCCESS_REDIRECT_URL =
  process.env.PAYMENT_SUCCESS_REDIRECT_URL ||
  "https://horim-elcharizi.co.il/success/";
const PAYMENT_TIMEOUT_MS = 30_000;

interface PaymentItem {
  UnitPrice: number;
  Quantity: number;
  Description: string;
}

const splitCustomerName = (fullName: string | undefined, fallback: string) => {
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

const buildPaymentItems = (order: Order): PaymentItem[] => {
  if (!order?.product_items?.length) return [];

  return order.product_items.map((item, index) => ({
    UnitPrice: Number(item.item_price ?? 0),
    Quantity: Number(item.quantity ?? 1),
    Description: item.title || item.name || `Order item ${index + 1}`,
  }));
};

const extractGroupTokenFragment = (redirectURL: string) => {
  try {
    const url = new URL(redirectURL);
    const token = url.searchParams.get("Token");
    const groupId = url.searchParams.get("GroupId") || PAYMENT_GROUP_TOKEN;
    if (!token) return null;

    return {
      groupId,
      token,
      fragment: `${groupId}&Token=${token}`,
    };
  } catch (err) {
    const tokenMatch = redirectURL.match(/Token=([^&]+)/i);
    const groupMatch = redirectURL.match(/GroupId=([^&]+)/i);
    const token = tokenMatch?.[1];
    const groupId = groupMatch?.[1] || PAYMENT_GROUP_TOKEN;
    if (!token) return null;

    return {
      groupId,
      token,
      fragment: `${groupId}&Token=${token}`,
    };
  }
};

export interface PaymentResult {
  success: boolean;
  orderId: string;
  paymentRequired: boolean;
  paymentLink?: string;
  paymentRedirectUrl?: string;
  error?: string;
}

export const generatePaymentLink = async (
  order: Order,
  customerPhone: string
): Promise<PaymentResult> => {
  const orderId = `ORDER_${Date.now()}_${customerPhone}`;

  try {
    const items = buildPaymentItems(order);

    if (!items.length) {
      throw new Error("No items found in order to charge");
    }

    const { firstName, lastName } = splitCustomerName(
      order.nameCustomer,
      customerPhone
    );

    const dataSale = {
      GroupPrivateToken: PAYMENT_GROUP_TOKEN,
      CustomerFirstName: firstName,
      CustomerLastName: lastName,
      Items: items,
      Currency: 1,
      IPNURL: PAYMENT_IPN_URL,
      EmailAddress: "tal@tkd.co.il",
      FailRedirectURL: PAYMENT_FAIL_REDIRECT_URL,
      RedirectURL: PAYMENT_SUCCESS_REDIRECT_URL,
    };

    console.log("data sale", dataSale)

    const response = await fetch(PAYMENT_PROVIDER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataSale),
    });

    if (!response.ok) {
      throw new Error(
        `Payment provider returned status ${response.status}`
      );
    }

    const responseData = await response.json();
    const statusToString = responseData?.Status?.toString?.() ?? "";
    const redirectURL = responseData?.URL as string | undefined;
    const fragment =
      (redirectURL && extractGroupTokenFragment(redirectURL)?.fragment) ||
      redirectURL;

    if (!redirectURL) {
      throw new Error(
        `Payment provider did not return a redirect URL (status: ${statusToString})`
      );
    }
    return {
      success: true,
      orderId,
      paymentLink: fragment,
      paymentRedirectUrl: redirectURL,
      paymentRequired: true,
    };
  } catch (error) {
    return {
      success: false,
      orderId,
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
  const items = buildPaymentItems(order);
  const totalAmount = items.reduce(
    (sum, item) => sum + item.UnitPrice * item.Quantity,
    0
  );

  if (totalAmount <= 0) {
    return {
      success: true,
      orderId: `ORDER_${Date.now()}_${customerPhone}`,
      paymentRequired: false,
    };
  }

  return generatePaymentLink(order, customerPhone);
};

export const validatePayment = async (orderId: string): Promise<boolean> => {
  // Mock payment validation - replace with actual payment gateway validation
  return true;
};

export const handleVerifyPayment = async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    console.log("[PAYMENT VERIFY] incoming payload", payload);

    const {
      businessPhone,
      customerPhone,
      timeStamp,
      phoneId,
      orderId,
    }: {
      businessPhone?: string;
      customerPhone?: string;
      timeStamp?: string;
      phoneId?: string;
      orderId?: string;
    } = payload;

    if (businessPhone && customerPhone && phoneId && orderId) {
      await sendSuccessToClient(
        businessPhone,
        customerPhone,
        timeStamp || "",
        phoneId,
        orderId
      );
    }

    return res
      .status(200)
      .json({ message: "Payment verification received", orderId: orderId || null });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment verification failed";
    console.error("Payment verification error:", message);
    return res.status(500).json({ message });
  }
};
