import { z } from "zod";

export const checkoutAddressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  street: z.string().min(1, "Street address is required"),
  postCode: z.string().optional(),
});

export const checkoutItemSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const checkoutPayloadSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Cart cannot be empty"),
  address: checkoutAddressSchema,
  division: z.string().min(1, "Division is required"),
  district: z.string().min(1, "District is required"),
  promoCode: z.string().optional(),
});

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;
