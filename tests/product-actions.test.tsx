import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock React State ────────────────────────────────────────────────
let mockStateValues: any[] = [];
let mockStateSetters: any[] = [];
let stateCallIndex = 0;

vi.mock("react", () => {
  return {
    useState: (initialValue: any) => {
      const idx = stateCallIndex++;
      if (mockStateValues.length <= idx) {
        mockStateValues.push(initialValue);
        const setter = vi.fn((newValOrFn: any) => {
          if (typeof newValOrFn === "function") {
            mockStateValues[idx] = newValOrFn(mockStateValues[idx]);
          } else {
            mockStateValues[idx] = newValOrFn;
          }
        });
        mockStateSetters.push(setter);
      }
      return [mockStateValues[idx], mockStateSetters[idx]];
    },
    useEffect: vi.fn(),
    createElement: (type: any, props: any, ...children: any[]) => ({ type, props, children }),
  };
});

import React from "react";

// ── Mocks ────────────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockAddItem = vi.fn();
vi.mock("@/store/useCartStore", () => ({
  useCartStore: (selector: any) => selector({ addItem: mockAddItem }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/product/InquiryDialog", () => ({
  InquiryDialog: "InquiryDialog",
}));

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: { user: { id: "test" } }, status: "authenticated" }))
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className, variant, ...rest }: any) =>
    React.createElement("button", { onClick, disabled, className, "data-variant": variant, ...rest }, children),
}));

vi.mock("@/types/product", () => ({
  formatPrice: (n: number) => `৳${n.toLocaleString()}`,
}));

vi.mock("lucide-react", () => ({
  Heart: "HeartIcon",
  ShoppingBag: "ShoppingBagIcon",
  Minus: "MinusIcon",
  Plus: "PlusIcon",
}));

import { ProductActions } from "@/components/product/ProductActions";

// ── Helpers ─────────────────────────────────────────────────────────
const mtoProduct = {
  id: "rg-001-center-coffee-table",
  name: "RG-001 Center Coffee Table",
  price: 31000,
  image: "/test.jpg",
  isAvailable: false,
  isMto: true,
};

const availableProduct = {
  id: "rg-002-dining-table",
  name: "RG-002 Dining Table",
  price: 50000,
  image: "/test2.jpg",
  isAvailable: true,
  isMto: false,
};

const unavailableProduct = {
  id: "rg-003-bookshelf",
  name: "RG-003 Bookshelf",
  price: 20000,
  image: "/test3.jpg",
  isAvailable: false,
  isMto: false,
};

const whatsappNumber = "8801700000000";

function resetStateMock() {
  mockStateValues = [];
  mockStateSetters = [];
  stateCallIndex = 0;
}

function renderComponent(props: Parameters<typeof ProductActions>[0]) {
  stateCallIndex = 0;
  return ProductActions(props);
}

function renderWithQuantity(props: Parameters<typeof ProductActions>[0], quantity: number) {
  resetStateMock();
  // addingToWishlist, isWishlisted, isWishlistLoaded, quantity, isNavigating
  mockStateValues = [false, false, false, quantity, false];
  mockStateSetters = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];
  stateCallIndex = 0;
  return ProductActions(props);
}

function extractTextFromTree(node: any): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  
  let result = "";
  if (node?.type && typeof node.type === "string") {
    result += node.type + " ";
  }
  if (node?.props?.["aria-label"]) {
    result += node.props["aria-label"] + " ";
  }

  if (Array.isArray(node)) return result + node.map(extractTextFromTree).join("");
  if (node?.children) result += extractTextFromTree(node.children);
  if (node?.props?.children) result += extractTextFromTree(node.props.children);
  return result;
}

function findTextInTree(node: any, text: string): boolean {
  const fullText = extractTextFromTree(node);
  return fullText.includes(text);
}

function findHandlerForText(node: any, text: string): (() => void) | null {
  if (node == null) return null;
  if (typeof node === "string" || typeof node === "number") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const found = findHandlerForText(n, text);
      if (found) return found;
    }
    return null;
  }
  if (node?.props?.onClick && extractTextFromTree(node).includes(text)) {
    return node.props.onClick;
  }
  if (node?.children) {
    const childFound = findHandlerForText(node.children, text);
    if (childFound) return childFound;
  }
  if (node?.props?.children) {
    return findHandlerForText(node.props.children, text);
  }
  return null;
}

function findDisabledForText(node: any, text: string): boolean | undefined {
  if (node == null) return undefined;
  if (typeof node === "string" || typeof node === "number") return undefined;
  if (Array.isArray(node)) {
    for (const n of node) {
      const found = findDisabledForText(n, text);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (node?.props?.disabled !== undefined && extractTextFromTree(node).includes(text)) {
    return node.props.disabled;
  }
  if (node?.children) {
    const childFound = findDisabledForText(node.children, text);
    if (childFound !== undefined) return childFound;
  }
  if (node?.props?.children) {
    return findDisabledForText(node.props.children, text);
  }
  return undefined;
}

// ── Tests ───────────────────────────────────────────────────────────
describe("ProductActions – Phase 6A Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStateMock();
  });

  it("Test 1: MTO product renders BUY button", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "BUY")).toBe(true);
  });

  it("Test 2: MTO product does NOT render DIRECT BUY", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "DIRECT BUY")).toBe(false);
  });

  it("Test 3: MTO product renders InquiryDialog", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "InquiryDialog")).toBe(true);
  });

  it("Test 4: Standard available product renders Add to Cart", () => {
    const tree = renderComponent({ product: availableProduct, whatsappNumber });
    expect(findTextInTree(tree, "Add to Cart")).toBe(true);
    expect(findTextInTree(tree, "BUY")).toBe(true);
  });

  it("Test 5: Unavailable product renders InquiryDialog", () => {
    const tree = renderComponent({ product: unavailableProduct, whatsappNumber });
    expect(findTextInTree(tree, "InquiryDialog")).toBe(true);
    expect(findTextInTree(tree, "Add to Cart")).toBe(false);
  });

  it("Test 6: MTO quantity defaults to 1", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "৳31,000")).toBe(true);
  });

  it("Test 7: Decrement at quantity 1 calls Math.max(1, 0) = 1", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    const minusHandler = findHandlerForText(tree, "Decrease quantity");
    expect(minusHandler).not.toBeNull();
    minusHandler!();
    const quantitySetter = mockStateSetters[3];
    expect(quantitySetter).toHaveBeenCalledTimes(1);
    expect(mockStateValues[3]).toBe(1); // 1 -> max(1, 0) = 1
  });

  it("Test 8: Increment updates quantity via state updater", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    const plusHandler = findHandlerForText(tree, "Increase quantity");
    expect(plusHandler).not.toBeNull();
    plusHandler!();
    const quantitySetter = mockStateSetters[3];
    expect(quantitySetter).toHaveBeenCalledTimes(1);
    expect(mockStateValues[3]).toBe(2); // 1 -> 2
  });

  it("Test 9: Estimated total = price × quantity (qty 1)", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "Estimated total")).toBe(true);
    expect(findTextInTree(tree, "৳31,000")).toBe(true);
  });

  it("Test 10: Lead time displays correctly for qty 1", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "Estimated lead time")).toBe(true);
    expect(findTextInTree(tree, "30 days")).toBe(true);
  });

  it("Test 11: BUY at qty 1 navigates to /checkout/mto?productId=...&qty=1", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    const buyHandler = findHandlerForText(tree, "BUY");
    buyHandler!();
    expect(mockPush).toHaveBeenCalledWith(`/checkout/mto?productId=${mtoProduct.id}&qty=1`);
  });

  it("Test 12: BUY at qty 3 navigates to /checkout/mto?productId=...&qty=3", () => {
    const tree = renderWithQuantity({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 }, 3);
    const buyHandler = findHandlerForText(tree, "BUY");
    buyHandler!();
    expect(mockPush).toHaveBeenCalledWith(`/checkout/mto?productId=${mtoProduct.id}&qty=3`);
  });

  it("Test 13: InquiryDialog does not route to MTO checkout", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "InquiryDialog")).toBe(true);
    const buyHandler = findHandlerForText(tree, "BUY");
    buyHandler!();
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush.mock.calls[0][0]).toContain("/checkout/mto");
  });

  it("Test 14: Wishlist button is rendered for MTO product", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "Add to Wishlist")).toBe(true);
    expect(findTextInTree(tree, "HeartIcon")).toBe(true);
  });

  it("Test 15: Missing lead-time values default to base=30, additional=10", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber });
    expect(findTextInTree(tree, "30 days")).toBe(true);
    expect(findTextInTree(tree, "৳31,000")).toBe(true);
  });

  it("Test 15b: Invalid lead-time values (0, negative) default correctly", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 0, additionalUnitLeadTimeDays: -5 });
    expect(findTextInTree(tree, "30 days")).toBe(true);
  });

  it("Test 15c: Non-integer lead-time values default correctly", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 25.5, additionalUnitLeadTimeDays: 7.3 });
    expect(findTextInTree(tree, "30 days")).toBe(true);
  });

  it("Test 16: MTO qty 3 displays estimated total=price*3, lead=base+20", () => {
    const tree = renderWithQuantity({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 }, 3);
    expect(findTextInTree(tree, "৳93,000")).toBe(true);
    expect(findTextInTree(tree, "50 days")).toBe(true);
  });

  it("MTO product renders quantity selector with Minus and Plus controls", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "Quantity")).toBe(true);
    expect(findTextInTree(tree, "MinusIcon")).toBe(true);
    expect(findTextInTree(tree, "PlusIcon")).toBe(true);
  });

  it("Non-MTO available product does NOT render quantity selector", () => {
    const tree = renderComponent({ product: availableProduct, whatsappNumber });
    expect(findTextInTree(tree, "Quantity")).toBe(false);
    expect(findTextInTree(tree, "Estimated total")).toBe(false);
    expect(findTextInTree(tree, "Estimated lead time")).toBe(false);
  });

  it("MTO product does NOT render Add to Cart", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "Add to Cart")).toBe(false);
  });

  it("Valid lead-time values are used when provided", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 45, additionalUnitLeadTimeDays: 15 });
    expect(findTextInTree(tree, "45 days")).toBe(true);
  });

  it("BUY button is not disabled on initial render", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    const disabled = findDisabledForText(tree, "BUY");
    expect(disabled).toBeFalsy();
  });

  it("Minus button is disabled at quantity 1", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    const disabled = findDisabledForText(tree, "Decrease quantity");
    expect(disabled).toBe(true);
  });

  it("Social sharing links are preserved for MTO product", () => {
    const tree = renderComponent({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 });
    expect(findTextInTree(tree, "Share:")).toBe(true);
  });

  it("Social sharing links are preserved for standard product", () => {
    const tree = renderComponent({ product: availableProduct, whatsappNumber });
    expect(findTextInTree(tree, "Share:")).toBe(true);
  });

  it("Wishlist is rendered for non-MTO available product", () => {
    const tree = renderComponent({ product: availableProduct, whatsappNumber });
    expect(findTextInTree(tree, "Add to Wishlist")).toBe(true);
  });

  it("Wishlist is rendered for unavailable product", () => {
    const tree = renderComponent({ product: unavailableProduct, whatsappNumber });
    expect(findTextInTree(tree, "Add to Wishlist")).toBe(true);
  });

  it("BUY at qty 2 navigates correctly", () => {
    const tree = renderWithQuantity({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 }, 2);
    const buyHandler = findHandlerForText(tree, "BUY");
    buyHandler!();
    expect(mockPush).toHaveBeenCalledWith(`/checkout/mto?productId=${mtoProduct.id}&qty=2`);
  });

  it("Qty 2 displays estimated total and lead time correctly", () => {
    const tree = renderWithQuantity({ product: mtoProduct, whatsappNumber, baseLeadTimeDays: 30, additionalUnitLeadTimeDays: 10 }, 2);
    expect(findTextInTree(tree, "৳62,000")).toBe(true);
    expect(findTextInTree(tree, "40 days")).toBe(true);
  });
});
