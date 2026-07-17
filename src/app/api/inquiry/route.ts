import { successResponse } from "@/lib/api-utils";
import { InquiryService } from "@/services/inquiry.service";

export async function POST(req: Request) {
  const data = await req.json();
  const inquiry = await InquiryService.createInquiry(data);
  return successResponse({ inquiry }, "Inquiry submitted successfully");
}
