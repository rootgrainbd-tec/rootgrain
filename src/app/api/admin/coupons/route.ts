import { withAdmin, successResponse } from "@/lib/api-utils";
import { adminService } from "@/services/admin.service";

export const GET = withAdmin(async () => {
  const coupons = await adminService.getCoupons();
  return successResponse({ coupons });
});

export const POST = withAdmin(async (req: Request) => {
  const body = await req.json();
  const { code, discountType, discountValue, maxUses, expiryDate } = body;

  const coupon = await adminService.createCoupon({
    code: code.toUpperCase(),
    discountType,
    discountValue: parseInt(discountValue),
    maxUses: maxUses ? parseInt(maxUses) : null,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
  });

  return successResponse({ coupon });
});

export const DELETE = withAdmin(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  // adminService.deleteCoupon throws AppError if missing ID
  await adminService.deleteCoupon(id as string);

  return successResponse();
});

export const PUT = withAdmin(async (req: Request) => {
  const body = await req.json();
  const { id, isActive } = body;

  const coupon = await adminService.updateCouponStatus(id, isActive);

  return successResponse({ coupon });
});
