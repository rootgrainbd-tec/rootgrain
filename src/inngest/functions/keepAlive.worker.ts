import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";

export const keepAliveWorker = inngest.createFunction(
  { 
    id: "database-keep-alive", 
    retries: 1,
    triggers: [{ cron: "0 4,12,20 * * *" }]
  },
  async ({ step }) => {
    const result = await step.run("ping-database", async () => {
      // Perform a minimal, safe read operation to maintain active database connections
      // and generate valid read queries as required by Supabase Free Plan policies.
      const record = await prisma.storeSettings.findFirst({
        select: { id: true },
      });
      return record;
    });

    return { 
      success: true, 
      message: "Database keep-alive read operation executed.",
      idFound: !!result
    };
  }
);
