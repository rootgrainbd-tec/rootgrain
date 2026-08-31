import { EventPayload, Inngest } from "inngest";

type Events = {
  "order/confirmation.requested": {
    data: {
      orderId: string;
      email: string;
    };
  };
  "document/generation.requested": {
    data: {
      orderDocumentId: string;
      documentType: "INVOICE" | "PAYMENT_RECEIPT" | "FINAL_INVOICE";
    };
  };
  "communication/email.requested": {
    data: {
      outboxId: string;
    };
  };
};

export const inngest = new Inngest({ id: "rootgrain-web", eventKey: process.env.INNGEST_EVENT_KEY || "local", schemas: { events: {} as Events } });
