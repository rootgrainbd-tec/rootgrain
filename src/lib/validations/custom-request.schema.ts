import { z } from "zod";

export const CustomRequestItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  designSpecs: z.string().optional(),
  dimensions: z.string().optional(),
  materialPreference: z.string().optional(),
  colorPreference: z.string().optional(),
  agreedUnitPrice: z.number().int().min(0, "Price cannot be negative").optional().nullable(),
});

export const CustomerOnlineRequestSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  estimatedCompletionDate: z.date().optional().nullable(),
  items: z.array(CustomRequestItemSchema).min(1, "At least one item is required"),
});

export const AdminOfflineRequestSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  mobileNumber: z.string().min(1, "Mobile number is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  estimatedCompletionDate: z.date().optional().nullable(),
  items: z.array(CustomRequestItemSchema).min(1, "At least one item is required"),
});

export const QuoteItemSchema = z.object({
  id: z.string(),
  agreedUnitPrice: z.number().int().min(0, "Price cannot be negative"),
});

export const QuotePreparationSchema = z.object({
  items: z.array(QuoteItemSchema).min(1, "At least one item is required"),
  deliveryCharge: z.number().int().min(0, "Delivery charge cannot be negative"),
  requiredAdvance: z.number().int().min(0, "Required advance cannot be negative"),
  estimatedCompletionDate: z.date(),
});
