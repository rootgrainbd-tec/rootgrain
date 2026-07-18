import { successResponse, handleAppError } from "@/lib/api-utils";
import { OrderService } from "@/services/order.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");

    const order = await OrderService.getOrderDetails(orderNumber as string);

    return successResponse({ order });
  } catch (error) {
    return handleAppError(error);
  }
}
