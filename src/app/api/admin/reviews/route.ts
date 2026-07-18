import { withAdmin, successResponse } from "@/lib/api-utils";
import { adminService } from "@/services/admin.service";

export const GET = withAdmin(async () => {
  const reviews = await adminService.getReviews();
  return successResponse({ reviews });
});

export const PUT = withAdmin(async (req: Request) => {
  const body = await req.json();
  const { id, status } = body;

  const review = await adminService.updateReviewStatus(id, status);

  return successResponse({ review });
});
