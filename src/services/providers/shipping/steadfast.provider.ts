import "server-only";
import { AppError, ValidationError } from "@/lib/errors/AppError";
import {
  ShippingProvider,
  CreateShipmentRequest,
  ProviderShipmentResult,
  NormalizedProviderStatus,
} from "./shipping-provider.interface";

export class SteadfastShippingProvider implements ShippingProvider {
  private readonly baseUrl = "https://portal.packzy.com/api/v1";

  private getHeaders(): HeadersInit {
    const apiKey = process.env.STEADFAST_API_KEY;
    const secretKey = process.env.STEADFAST_SECRET_KEY;

    if (!apiKey || !secretKey) {
      throw new AppError("Steadfast credentials are not configured", 500);
    }

    return {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    };
  }

  private normalizeStatus(status: string): NormalizedProviderStatus {
    const s = status.toLowerCase();
    switch (s) {
      case "pending":
      case "in_review":
        return { type: "TRANSITION", targetState: "FINALIZED" };
      case "delivered":
        return { type: "TRANSITION", targetState: "DELIVERED" };
      case "cancelled":
      case "cancelled_approval_pending":
        return { type: "CANCEL_ORDER", providerRawStatus: status };
      case "partial_delivered":
      case "partial_delivered_approval_pending":
      case "hold":
      case "unknown":
      case "unknown_approval_pending":
      default:
        return { type: "PROVIDER_ONLY", providerRawStatus: status };
    }
  }

  public async getShipmentStatus(invoice: string): Promise<ProviderShipmentResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${this.baseUrl}/status_by_invoice/${encodeURIComponent(invoice)}`, {
        method: "GET",
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new AppError("Shipment not found", 404);
      }

      if (response.status === 401 || response.status === 403) {
        throw new AppError("Provider authentication failed", 500);
      }

      if (response.status === 429) {
        throw new AppError("Provider rate limit exceeded", 429);
      }

      if (!response.ok) {
        throw new AppError(`Provider error: ${response.status}`, 502);
      }

      const data = await response.json();
      
      // Steadfast typically returns { delivery_status: "...", tracking_code: "..." }
      // We must map it safely
      const status = data.delivery_status;
      const trackingCode = data.tracking_code;

      if (!status || !trackingCode) {
        throw new AppError("Malformed provider response", 502);
      }

      return {
        trackingReference: trackingCode,
        normalizedStatus: this.normalizeStatus(status),
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new AppError("Provider timeout (UNKNOWN OUTCOME)", 502);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  public async createShipment(request: CreateShipmentRequest): Promise<ProviderShipmentResult> {
    // 1. Validation
    if (request.recipient.phone.length !== 11) {
      throw new ValidationError("Recipient phone must be 11 digits");
    }

    const fullAddress = `${request.recipient.street}, ${request.recipient.district}, ${request.recipient.division}`;
    if (fullAddress.length > 250) {
      throw new ValidationError("Recipient address exceeds maximum 250 characters");
    }

    // 2. Idempotency Pre-Check
    try {
      const existing = await this.getShipmentStatus(request.invoice);
      return existing; // Found, reconcile
    } catch (error: any) {
      if (error.statusCode !== 404) {
        // If it's auth error, rate limit, timeout, or 502, we must not proceed
        throw error;
      }
      // 404 means safe to create
    }

    // 3. Create Shipment
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const payload = {
      invoice: request.invoice,
      recipient_name: request.recipient.name,
      recipient_phone: request.recipient.phone,
      recipient_address: fullAddress,
      cod_amount: request.codAmount,
      note: request.note || "",
      delivery_type: request.deliveryType,
    };

    try {
      const response = await fetch(`${this.baseUrl}/create_order`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (response.status === 400) {
        // Could be duplicate invoice or validation error.
        const data = await response.json().catch(() => ({}));
        
        // If it's a duplicate invoice, recover it
        if (JSON.stringify(data).toLowerCase().includes("invoice") && JSON.stringify(data).toLowerCase().includes("exist")) {
           try {
             return await this.getShipmentStatus(request.invoice);
           } catch (recoveryError) {
             throw new AppError("Failed to recover shipment after duplicate response", 502);
           }
        }
        
        throw new ValidationError("Provider validation failed");
      }

      if (response.status === 401 || response.status === 403) {
        throw new AppError("Provider authentication failed", 500);
      }

      if (response.status === 429) {
        throw new AppError("Provider rate limit exceeded", 429);
      }

      if (!response.ok) {
        throw new AppError(`Provider error: ${response.status}`, 502);
      }

      const data = await response.json();
      
      const trackingCode = data.consignment?.tracking_code;
      const status = data.consignment?.status;

      if (!trackingCode || !status) {
         throw new AppError("Malformed provider create response", 502);
      }

      return {
        trackingReference: trackingCode,
        normalizedStatus: this.normalizeStatus(status),
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new AppError("Provider timeout (UNKNOWN OUTCOME). Retry required for reconciliation.", 502);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
