import { z } from "zod";
import { checkoutAddressSchema } from "./checkout.schema";

export const mtoCheckoutPayloadSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer").min(1),
  address: checkoutAddressSchema,
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  promoCode: z.string().optional(),
  customerNote: z.string().optional(),
  idempotencyKey: z.string().uuid("Idempotency key is required"),
  _diagnostic: z.boolean().optional(),
});

export type MtoCheckoutPayload = z.infer<typeof mtoCheckoutPayloadSchema>;
