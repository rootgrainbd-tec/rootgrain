/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MtoCheckoutClient } from "@/app/(storefront)/checkout/mto/MtoCheckoutClient";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

describe("MTO Diagnostic Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url) => {
      if (url === "/api/user/address") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ success: true, data: { orderNumber: "MTO-TEST" } })),
        json: () => Promise.resolve({ success: true, data: { orderNumber: "MTO-TEST" } }),
      });
    });
  });

  afterEach(() => {
    cleanup();
  });

  const mockItem = {
    id: "rg-001-center-coffee-table",
    name: "Center Coffee Table",
    price: 10000,
    image: "/test.jpg",
    quantity: 1,
  };

  it("should have a diagnostic button that submits a hardcoded valid payload", async () => {
    render(<MtoCheckoutClient item={mockItem} baseLeadTimeDays={30} additionalUnitLeadTimeDays={10} />);
    
    // Check if diagnostic block exists
    const diagnosticBlock = await screen.findByTestId("diagnostic-block");
    expect(diagnosticBlock).toBeDefined();

    // Click diagnostic button
    const btn = screen.getByTestId("diagnostic-btn");
    fireEvent.click(btn);

    // Assert fetch was called with expected payload
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/checkout/mto", expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }));
    });

    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(c => c[0] === "/api/checkout/mto");
    expect(call).toBeDefined();
    
    const body = JSON.parse(call![1].body);
    expect(body.productId).toBe("rg-001-center-coffee-table");
    expect(body.quantity).toBe(1);
    expect(body.idempotencyKey).toBeDefined();
    expect(body.idempotencyKey.length).toBeGreaterThan(10);
    expect(body.division).toBe("Dhaka");
    expect(body.district).toBe("Dhaka");
    expect(body.address.email).toBe("diagnostic@rootgrain.bd");

    // Check DOM output
    const status = await screen.findByTestId("diagnostic-status");
    expect(status.textContent).toContain("Status: 200");
    
    const duration = await screen.findByTestId("diagnostic-duration");
    expect(duration.textContent).toMatch(/Duration: \d+ms/);
    
    const jsonOutput = await screen.findByTestId("diagnostic-json");
    expect(jsonOutput.textContent).toContain("MTO-TEST");
  });

  it("should handle HTTP 500 properly and display raw error output", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url) => {
      if (url === "/api/user/address") return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({
        ok: false,
        status: 500,
        text: () => Promise.resolve(JSON.stringify({ error: { message: "Simulated 500 Error" } })),
      });
    });

    render(<MtoCheckoutClient item={mockItem} baseLeadTimeDays={30} additionalUnitLeadTimeDays={10} />);
    
    const btn = await screen.findByTestId("diagnostic-btn");
    fireEvent.click(btn);

    const status = await screen.findByTestId("diagnostic-status");
    expect(status.textContent).toContain("Status: 500");
    
    const jsonOutput = await screen.findByTestId("diagnostic-json");
    expect(jsonOutput.textContent).toContain("Simulated 500 Error");
  });
  
  it("should handle network errors properly", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url) => {
      if (url === "/api/user/address") return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.reject(new Error("Network connection failed"));
    });

    render(<MtoCheckoutClient item={mockItem} baseLeadTimeDays={30} additionalUnitLeadTimeDays={10} />);
    
    const btn = await screen.findByTestId("diagnostic-btn");
    fireEvent.click(btn);

    const status = await screen.findByTestId("diagnostic-status");
    expect(status.textContent).toContain("Status: NETWORK_ERROR");
    
    const jsonOutput = await screen.findByTestId("diagnostic-json");
    expect(jsonOutput.textContent).toContain("Network connection failed");
  });
});
