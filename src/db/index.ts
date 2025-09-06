import { Order, MatchedItem, ManagerStatus } from "../types";

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

class MessageDao {
  private messages: Map<string, StoredMessage> = new Map();
  private managerStatus: Map<string, ManagerStatusData> = new Map();

  async storeMessage(data: {
    customerPhone: string;
    timestamp: string;
    order: Order;
    matchedItems: MatchedItem[];
    name: string;
    flowCounter: number;
  }): Promise<void> {
    this.messages.set(data.customerPhone, data);
    console.log("Message stored:", data);
  }

  async getMessage(customerPhone: string): Promise<StoredMessage | null> {
    return this.messages.get(customerPhone) || null;
  }

  async deleteMessage(customerPhone: string): Promise<void> {
    this.messages.delete(customerPhone);
    console.log("Message deleted for:", customerPhone);
  }

  async storeManagetStatus(
    customerPhone: string,
    status: string
  ): Promise<void> {
    this.managerStatus.set(customerPhone, {
      customerPhone,
      managerStatus: status,
    });
    console.log("Manager status stored:", { customerPhone, status });
  }

  async getManagetStatus(
    customerPhone: string
  ): Promise<ManagerStatusData | null> {
    return this.managerStatus.get(customerPhone) || null;
  }
}

export const PostgresDao = MessageDao;
