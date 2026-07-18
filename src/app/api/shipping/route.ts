import { successResponse } from "@/lib/api-utils";
import { ShippingService } from "@/services/shipping.service";

export async function GET() {
  const rates = await ShippingService.getAllRates();
  return successResponse({ rates });
}
