export interface IncomingData {
  businessPhone: string;
  customerPhone: string;
  customerName: string;
  timeStamp: string;
  phoneId: string;
  message: any;
}

export interface MessageType {
  TEXT: "text";
  ORDER: "order";
  INTERACTIVE: "interactive";
}

export const typeOrder: MessageType = {
  TEXT: "text",
  ORDER: "order",
  INTERACTIVE: "interactive",
};

export interface ProductItem {
  product_retailer_id: string;
  quantity: number;
  item_price: number;
  currency: string;
  title?: string;
  name?: string;
  note?: string;
  add_ons?: ProductItem[];
  sub_items?: ProductItem[];
}

export interface Order {
  product_items: ProductItem[];
  delivery?: Record<string, string>;
  note?: string;
  nameCustomer?: string;
  orderType?: string;
}

export interface MatchedItem {
  product_retailer_id: string;
  name: string;
  quantity: number;
}

export interface ManagerStatus {
  ON: "ON";
  OFF: "OFF";
}

export const ManagerStatus: ManagerStatus = {
  ON: "ON",
  OFF: "OFF",
};

export interface OrderTypeDispatch {
  SITTING: "SITTING";
  TAKEAWAY: "TAKEAWAY";
  DELIVERY: "DELIVERY";
}

export const OrderTypeDispatch: OrderTypeDispatch = {
  SITTING: "SITTING",
  TAKEAWAY: "TAKEAWAY",
  DELIVERY: "DELIVERY",
};

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
