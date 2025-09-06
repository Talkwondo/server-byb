import { IncomingData } from "../../types";
import { sendTextToClient } from "../messages";

export const handleManagerRequest = async (
  businessPhone: string,
  customerPhone: string,
  customerName: string,
  timeStamp: string,
  phoneId: string,
  message: any
) => {
  console.log("Handling manager request:", {
    businessPhone,
    customerPhone,
    customerName,
    timeStamp,
    phoneId,
    message,
  });

  // Send manager mode activated message
  await sendTextToClient(
    businessPhone,
    customerPhone,
    timeStamp,
    phoneId,
    "מצב מנהל מופעל. כל ההודעות יועברו למנהל."
  );

  // Here you would typically forward the message to a manager
  // or store it for manager review
  console.log("Manager mode activated for customer:", customerPhone);
};
