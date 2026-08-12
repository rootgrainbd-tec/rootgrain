import { withAdmin, successResponse } from "@/lib/api-utils";
import { adminService } from "@/services/admin.service";

export const GET = withAdmin(async () => {
  const rates = await adminService.getShippingTypeRates();
  return successResponse({ rates });
});

export const POST = withAdmin(async (request: Request) => {
  const body = await request.json();
  const { shippingType, baseRate, additionalRate } = body;

  const rate = await adminService.upsertShippingTypeRate(
    shippingType,
    Number(baseRate),
    Number(additionalRate)
  );

  return successResponse({ rate });
});
