import { z } from "zod";
import { AuthorizationContextSchema } from "../schemas/authorization-context.schema";

export type AuthorizationContext = z.infer<typeof AuthorizationContextSchema>;
