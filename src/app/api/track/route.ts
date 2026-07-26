import { successResponse, handleAppError } from "@/lib/api-utils";
import { OrderService } from "@/services/order.service";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppError } from "@/lib/errors/AppError";

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      throw new AppError("Invalid JSON body", 400);
    }

    const { orderNumber, email, token } = body;

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const order = await OrderService.getOrderDetails(orderNumber as string, email as string | undefined, userId, token as string | undefined);

    // Response Minimization (Phase 7): Return only fields required by the UI
    // Ensure internal IDs that are strictly not needed by UI are omitted if possible.
    // Preserving item.id and productId as they are often required by React list keys.
    const safeOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      total: order.total,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.unitPrice,
        productName: item.productName
      }))
    };

    return successResponse({ order: safeOrder });
  } catch (error) {
    return handleAppError(error);
  }
}
