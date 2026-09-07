import { describe, it, expect } from "vitest";
import productSchema from "../sanity/schemas/product";

describe("Sanity Product Schema Validation", () => {
  it("should have document-level validation for shippingType", () => {
    expect(productSchema.validation).toBeDefined();
    
    // Create a mock Rule
    let capturedValidator: (doc: any, context?: any) => any;
    const mockRule = {
      custom: (fn: any) => {
        capturedValidator = fn;
        return mockRule;
      },
    };

    // Extract the validator
    if (typeof productSchema.validation === "function") {
      productSchema.validation(mockRule as any);
    }

    expect(capturedValidator!).toBeDefined();

    // Test Case 1: Available + shippingType = valid
    expect(capturedValidator!({ availability: "Available", shippingType: "large" })).toBe(true);

    // Test Case 2: Available + shippingType = missing -> validation error
    const errorResult = capturedValidator!({ availability: "Available" });
    expect(errorResult).toEqual({
      message: "Shipping type is required for Available products.",
      paths: [["shippingType"]],
    });

    // Test Case 3: MTO + shippingType = missing -> valid
    expect(capturedValidator!({ availability: "Made-to-Order" })).toBe(true);

    // Test Case 4: Sold + shippingType = missing -> valid
    expect(capturedValidator!({ availability: "Sold" })).toBe(true);
    
    // Check for _id bypass
    const validatorStr = capturedValidator!.toString();
    expect(validatorStr).not.toContain("drafts.");
  });
  
  it("should NOT have field-level validation on shippingType", () => {
    const shippingTypeField = productSchema.fields.find(f => f.name === 'shippingType');
    expect(shippingTypeField).toBeDefined();
    expect(shippingTypeField!.validation).toBeUndefined();
  });
});
