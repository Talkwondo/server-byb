import { dynamicFlowService } from "./index";
import { cryptoService } from "../crypto";

/**
 * Example usage of dynamic flow service
 */
export const exampleUsage = async () => {
  // 1. Create a dynamic flow for a customer
  const flow = await dynamicFlowService.createFlow(
    "+972501234567",
    "hamburger",
    {
      productId: "104",
      productName: "המבורגר",
      price: 45,
    }
  );

  console.log("Created flow:", flow.flowToken);

  // 2. Generate WhatsApp flow configuration
  const whatsappFlow = dynamicFlowService.generateWhatsAppFlow(flow, {
    // Additional flow parameters
    customization_options: ["meat", "cheese", "vegetables"],
  });

  console.log("WhatsApp flow config:", whatsappFlow);

  // 3. Process flow response (simulated)
  const responseData = {
    meat: "beef",
    cheese: "cheddar",
    vegetables: ["lettuce", "tomato"],
  };

  const result = await dynamicFlowService.processFlowResponse(
    flow.flowToken,
    responseData
  );

  console.log("Flow response result:", result);

  // 4. Update flow status when completed
  if (result.success) {
    await dynamicFlowService.updateFlowStatus(flow.flowToken, "completed");
  }

  // 5. Clean up expired flows
  await dynamicFlowService.cleanupExpiredFlows();
};

/**
 * Example of crypto service usage
 */
export const cryptoExample = () => {
  // Generate a flow token
  const flowToken = cryptoService.generateFlowToken({
    customerId: "12345",
    productType: "hamburger",
  });

  console.log("Flow token:", flowToken);

  // Encrypt sensitive data
  const sensitiveData = {
    customerPhone: "+972501234567",
    orderDetails: { items: ["hamburger", "fries"] },
  };

  const encrypted = cryptoService.encryptFlowData(sensitiveData);
  console.log("Encrypted data:", encrypted);

  // Decrypt data
  const decrypted = cryptoService.decryptFlowData(encrypted);
  console.log("Decrypted data:", decrypted);

  // Generate session ID
  const sessionId = cryptoService.generateSessionId("+972501234567");
  console.log("Session ID:", sessionId);
};
