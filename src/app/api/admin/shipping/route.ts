import { withAdmin, successResponse } from "@/lib/api-utils";
import { adminService } from "@/services/admin.service";

export const GET = withAdmin(async () => {
  const rates = await adminService.getShippingRates();
  return successResponse({ rates });
});

export const POST = withAdmin(async (request: Request) => {
  const body = await request.json();
  const { district, baseRate, perItemRate } = body;

  const rate = await adminService.upsertShippingRate(district, Number(baseRate), Number(perItemRate));

  return successResponse({ rate });
});

export const DELETE = withAdmin(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  await adminService.deleteShippingRate(id as string);

  return successResponse();
});
