import { z } from "zod";
import { AuthorizationDecisionSchema } from "../schemas/authorization-decision.schema";

export type AuthorizationDecision = z.infer<typeof AuthorizationDecisionSchema>;
