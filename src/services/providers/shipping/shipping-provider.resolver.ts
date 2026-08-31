import { LogisticsProvider } from "@prisma/client";
import { ShippingProvider } from "./shipping-provider.interface";
import { SteadfastShippingProvider } from "./steadfast.provider";

export class ShippingProviderResolver {
  /**
   * Resolves the appropriate ShippingProvider instance for a given LogisticsProvider enum.
   * Returns null for manual/private freight to enforce the manual firewall.
   */
  static resolve(logistics: LogisticsProvider): ShippingProvider | null {
    switch (logistics) {
      case "STEADFAST":
        return new SteadfastShippingProvider();
      case "PRIVATE_FREIGHT":
        return null; // Manual firewall
      default:
        throw new Error(`Unsupported logistics provider: ${logistics}`);
    }
  }
}
