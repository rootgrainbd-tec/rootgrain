export type DocumentBrandingSnapshot = {
  companyName: string;
  address: {
    line1: string;
    line2: string;
  };
  email: string;
  phone: string;
};

export type ShippingAddressSnapshot = {
  name: string;
  address: string;
  apartment?: string | null;
  city: string;
  postalCode: string;
  phone: string;
};

export type InvoiceItemSnapshot = {
  productId: string | null;
  productName: string;
  customSpecification?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoiceSnapshot = {
  invoiceType: "ADVANCE" | "FINAL";
  orderTotal: number;
  requiredAdvance: number;
  validPaidAtIssuance?: number;
  balanceDueAtIssuance?: number;
  shippingAddress: ShippingAddressSnapshot | null;
  items: InvoiceItemSnapshot[];
  customerEmail: string;
  issuedAt: string;
  referenceIdentity?: string;
  branding: DocumentBrandingSnapshot;
};

export type ReceiptSnapshot = {
  amount: number;
  type: string;
  method: string;
  reference: string | null;
  paidAt: Date | string | null;
  referenceIdentity?: string;
  linkedInvoiceReference?: string;
  customerName?: string;
  branding: DocumentBrandingSnapshot;
};
