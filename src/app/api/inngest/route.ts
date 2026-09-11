import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateDocument } from "@/inngest/functions/generateDocument";
import { communicationWorker } from "@/inngest/functions/communication.worker";
import { keepAliveWorker } from "@/inngest/functions/keepAlive.worker";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateDocument,
    communicationWorker,
    keepAliveWorker
  ],
});
