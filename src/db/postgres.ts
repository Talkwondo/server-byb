import { db } from "./connection";
import { Order, MatchedItem } from "../types";

interface StoredMessage {
  customerPhone: string;
  timestamp: string;
  order: Order;
  matchedItems: MatchedItem[];
  name: string;
  flowCounter: number;
}

interface ManagerStatusData {
  customerPhone: string;
  managerStatus: string;
}

export class PostgresDao {
  async storeMessage(data: {
    customerPhone: string;
    timestamp: string;
    order: Order;
    matchedItems: MatchedItem[];
    name: string;
    flowCounter: number;
  }): Promise<void> {
    // First ensure user exists
    await this.ensureUser(data.customerPhone);

    // Convert Unix timestamp to proper timestamp format
    const timestampValue = new Date(parseInt(data.timestamp) * 1000);

    // Store message
    await db("messages").insert({
      customer_phone: data.customerPhone,
      business_phone: "default", // You can make this configurable
      timestamp: timestampValue,
      order_data: data.order,
      matched_items: data.matchedItems,
      name: data.name,
      flow_counter: data.flowCounter,
    });

    console.log("Message stored in PostgreSQL:", data);
  }

  async getMessage(customerPhone: string): Promise<StoredMessage | null> {
    const result = await db("messages")
      .where("customer_phone", customerPhone)
      .orderBy("created_at", "desc")
      .first();

    if (!result) return null;

    return {
      customerPhone: result.customer_phone,
      timestamp: result.timestamp,
      order: result.order_data,
      matchedItems: result.matched_items,
      name: result.name,
      flowCounter: result.flow_counter,
    };
  }

  async deleteMessage(customerPhone: string): Promise<void> {
    await db("messages").where("customer_phone", customerPhone).del();
    console.log("Message deleted from PostgreSQL for:", customerPhone);
  }

  async storeManagetStatus(
    customerPhone: string,
    status: string
  ): Promise<void> {
    // First ensure user exists
    await this.ensureUser(customerPhone);

    await db("manager_status")
      .insert({
        customer_phone: customerPhone,
        manager_status: status,
      })
      .onConflict("customer_phone")
      .merge();

    console.log("Manager status stored in PostgreSQL:", {
      customerPhone,
      status,
    });
  }

  async getManagetStatus(
    customerPhone: string
  ): Promise<ManagerStatusData | null> {
    const result = await db("manager_status")
      .where("customer_phone", customerPhone)
      .first();

    if (!result) return null;

    return {
      customerPhone: result.customer_phone,
      managerStatus: result.manager_status,
    };
  }

  private async ensureUser(phone: string): Promise<void> {
    await db("users")
      .insert({
        phone,
        customer_name: phone, // Default name
      })
      .onConflict("phone")
      .ignore();
  }
}

// Export PostgreSQL DAO
export { PostgresDao as default };
