import { cryptoService, FlowToken, EncryptedFlowData } from "../crypto";
import { db } from "../../db/connection";

export interface DynamicFlow {
  id: string;
  flowToken: string;
  customerPhone: string;
  flowType: string;
  flowData: any;
  encryptedMetadata: EncryptedFlowData;
  status: "active" | "completed" | "expired";
  createdAt: Date;
  expiresAt: Date;
}

export interface FlowStep {
  stepId: string;
  title: string;
  type: "text" | "choice" | "input" | "summary";
  options?: string[];
  validation?: any;
  nextStep?: string;
}

export class DynamicFlowService {
  /**
   * Create a new dynamic flow for a customer
   */
  async createFlow(
    customerPhone: string,
    flowType: string,
    flowData: any = {}
  ): Promise<DynamicFlow> {
    const sessionId = cryptoService.generateSessionId(customerPhone);

    const { flowToken, encryptedMetadata, hash } =
      cryptoService.createDynamicFlow(flowType, { customerPhone, ...flowData });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const flow: DynamicFlow = {
      id: sessionId,
      flowToken,
      customerPhone,
      flowType,
      flowData,
      encryptedMetadata,
      status: "active",
      createdAt: new Date(),
      expiresAt,
    };

    // Store flow in database
    await db("dynamic_flows").insert({
      id: flow.id,
      flow_token: flow.flowToken,
      customer_phone: flow.customerPhone,
      flow_type: flow.flowType,
      flow_data: flow.flowData,
      encrypted_metadata: flow.encryptedMetadata,
      status: flow.status,
      created_at: flow.createdAt,
      expires_at: flow.expiresAt,
    });

    return flow;
  }

  /**
   * Get flow by token
   */
  async getFlowByToken(flowToken: string): Promise<DynamicFlow | null> {
    const result = await db("dynamic_flows")
      .where("flow_token", flowToken)
      .where("status", "active")
      .where("expires_at", ">", new Date())
      .first();

    if (!result) return null;

    return {
      id: result.id,
      flowToken: result.flow_token,
      customerPhone: result.customer_phone,
      flowType: result.flow_type,
      flowData: result.flow_data,
      encryptedMetadata: result.encrypted_metadata,
      status: result.status,
      createdAt: result.created_at,
      expiresAt: result.expires_at,
    };
  }

  /**
   * Update flow status
   */
  async updateFlowStatus(
    flowToken: string,
    status: "active" | "completed" | "expired"
  ): Promise<void> {
    await db("dynamic_flows").where("flow_token", flowToken).update({ status });
  }

  /**
   * Generate WhatsApp flow configuration
   */
  generateWhatsAppFlow(flow: DynamicFlow, stepData: any = {}): any {
    const flowConfig = {
      messaging_product: "whatsapp",
      type: "interactive",
      interactive: {
        type: "flow",
        body: {
          text: this.getFlowBodyText(flow.flowType),
        },
        action: {
          name: "flow",
          parameters: {
            flow_token: flow.flowToken,
            mode: "draft",
          },
          ...stepData,
        },
      },
    };

    return flowConfig;
  }

  /**
   * Process flow response from WhatsApp
   */
  async processFlowResponse(
    flowToken: string,
    responseData: any
  ): Promise<{
    success: boolean;
    nextStep?: string;
    data?: any;
    error?: string;
  }> {
    const flow = await this.getFlowByToken(flowToken);

    if (!flow) {
      return { success: false, error: "Flow not found or expired" };
    }

    // Validate flow token
    const validation = cryptoService.validateFlowToken(
      flowToken,
      flow.encryptedMetadata
    );
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Process response based on flow type
    const processedData = await this.processFlowByType(
      flow.flowType,
      responseData
    );

    return {
      success: true,
      data: processedData,
      nextStep: this.getNextStep(flow.flowType, responseData),
    };
  }

  /**
   * Get flow body text based on flow type
   */
  private getFlowBodyText(flowType: string): string {
    const flowTexts: Record<string, string> = {
      hamburger: "איך תרצו את ההמבורגר?",
      pizza: "איך תרצו את הפיצה?",
      salad: "איך תרצו את הסלט?",
      summary: "סיכום הזמנתכם:",
      default: "בחרו מהאפשרויות הבאות:",
    };

    return flowTexts[flowType] || flowTexts.default;
  }

  /**
   * Process flow response by type
   */
  private async processFlowByType(
    flowType: string,
    responseData: any
  ): Promise<any> {
    switch (flowType) {
      case "hamburger":
        return this.processHamburgerFlow(responseData);
      case "pizza":
        return this.processPizzaFlow(responseData);
      case "salad":
        return this.processSaladFlow(responseData);
      case "summary":
        return this.processSummaryFlow(responseData);
      default:
        return responseData;
    }
  }

  /**
   * Process hamburger flow responses
   */
  private async processHamburgerFlow(responseData: any): Promise<any> {
    return {
      type: "hamburger",
      customizations: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Process pizza flow responses
   */
  private async processPizzaFlow(responseData: any): Promise<any> {
    return {
      type: "pizza",
      customizations: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Process salad flow responses
   */
  private async processSaladFlow(responseData: any): Promise<any> {
    return {
      type: "salad",
      customizations: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Process summary flow responses
   */
  private async processSummaryFlow(responseData: any): Promise<any> {
    return {
      type: "summary",
      orderData: responseData,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get next step based on current flow and response
   */
  private getNextStep(flowType: string, responseData: any): string | undefined {
    const flowSteps: Record<string, string> = {
      hamburger: "summary",
      pizza: "summary",
      salad: "summary",
      summary: "payment",
    };

    return flowSteps[flowType];
  }

  /**
   * Clean up expired flows
   */
  async cleanupExpiredFlows(): Promise<void> {
    await db("dynamic_flows")
      .where("expires_at", "<", new Date())
      .update({ status: "expired" });
  }
}

// Export singleton instance
export const dynamicFlowService = new DynamicFlowService();
