import { InvoiceSnapshot, InvoiceItemSnapshot, ShippingAddressSnapshot } from "@/types/document";

export interface BuildInvoiceSnapshotOptions {
  invoiceType?: "ADVANCE" | "FINAL";
  referenceIdentity?: string;
  validPaidAtIssuance?: number;
  balanceDueAtIssuance?: number;
  issuedAt?: string;
}

export interface SiteConfigBrandingInput {
  name: string;
  address: {
    line1: string;
    line2: string;
  };
  support: {
    email: string;
    phone: {
      display: string;
    };
  };
}

export function buildShippingAddressSnapshot(rawShipping: any): ShippingAddressSnapshot | null {
  if (!rawShipping) return null;
  return {
    name: String(rawShipping.name || ""),
    address: String(rawShipping.street || rawShipping.address || ""),
    apartment: rawShipping.apartment ? String(rawShipping.apartment) : null,
    city: String(rawShipping.district || rawShipping.city || ""),
    postalCode: String(rawShipping.postCode || rawShipping.postalCode || ""),
    phone: String(rawShipping.phone || ""),
  };
}

export function buildInvoiceItemsSnapshot(items: any[]): InvoiceItemSnapshot[] {
  if (!Array.isArray(items)) return [];
  return items.map((item: any) => ({
    productId: item.productId ? String(item.productId) : null,
    productName: String(item.productName || item.name || "Unknown Item"),
    customSpecification: item.customSpecification ? String(item.customSpecification) : null,
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unitPrice || item.price || 0),
    total: Number(item.total ?? (Number(item.quantity || 1) * Number(item.unitPrice || item.price || 0))),
  }));
}

export function buildInvoiceSnapshot(
  order: any,
  siteConfig: SiteConfigBrandingInput,
  options: BuildInvoiceSnapshotOptions = {}
): InvoiceSnapshot {
  const rawShipping = order.shippingAddress as any;
  const shippingAddress = buildShippingAddressSnapshot(rawShipping);
  const items = buildInvoiceItemsSnapshot(order.items);

  const customerEmail = String(
    rawShipping?.email ||
    order.user?.email ||
    order.customerEmail ||
    ""
  );

  const orderTotal = Number(order.total ?? 0);
  const requiredAdvance = Number(order.requiredAdvance ?? 0);
  const invoiceType = options.invoiceType || "ADVANCE";

  if (invoiceType === "FINAL") {
    if (
      typeof options.validPaidAtIssuance !== "number" ||
      !Number.isFinite(options.validPaidAtIssuance) ||
      typeof options.balanceDueAtIssuance !== "number" ||
      !Number.isFinite(options.balanceDueAtIssuance)
    ) {
      throw new Error("Final invoice requires explicit validPaidAtIssuance and balanceDueAtIssuance settlement fields (finite numbers)");
    }
  }

  return {
    invoiceType,
    orderTotal,
    requiredAdvance,
    validPaidAtIssuance: options.validPaidAtIssuance,
    balanceDueAtIssuance: options.balanceDueAtIssuance,
    shippingAddress,
    items,
    customerEmail,
    issuedAt: options.issuedAt || new Date().toISOString(),
    referenceIdentity: options.referenceIdentity || (order.orderNumber ? `INV-${order.orderNumber}-1` : undefined),
    branding: {
      companyName: siteConfig.name,
      address: siteConfig.address,
      email: siteConfig.support.email,
      phone: siteConfig.support.phone.display,
    },
    subtotal: typeof order.subtotal === "number" ? order.subtotal : undefined,
    shippingCost: typeof order.shippingCost === "number" ? order.shippingCost : undefined,
    discountAmount: typeof order.discountAmount === "number" ? order.discountAmount : undefined,
    orderNumber: order.orderNumber ? String(order.orderNumber) : undefined,
  };
}
