import { EventPayload, Inngest } from "inngest";

type Events = {
  "order/confirmation.requested": {
    data: {
      orderId: string;
      email: string;
    };
  };
};

export const inngest = new Inngest({ id: "rootgrain-web", schemas: { events: {} as Events } });
