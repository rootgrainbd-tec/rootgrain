import { successResponse, handleAppError } from "@/lib/api-utils";
import { CheckoutService } from "@/services/checkout.service";

export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();

    const result = await CheckoutService.validateCoupon(code, subtotal);

    return successResponse(result);
  } catch (error) {
    return handleAppError(error);
  }
}
