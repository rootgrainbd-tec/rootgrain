import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    
    // Check Authorization header for Bearer token
    if (authHeader !== `Bearer ${process.env.SANITY_WEBHOOK_SECRET}`) {
      console.warn("Invalid webhook secret");
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    const body = await req.json();
    const { _type, slug } = body;

    // Based on the document type that was updated, revalidate relevant pages
    if (_type === "product") {
      revalidatePath("/collection");
      revalidatePath("/");
      if (slug?.current) {
        revalidatePath(`/product/${slug.current}`);
      }
    } else if (_type === "category") {
      revalidatePath("/collection");
    } else if (_type === "homepage" || _type === "siteSettings") {
      revalidatePath("/");
      revalidatePath("/", "layout"); // Clears everything globally
    } else {
      // Revalidate everything as a fallback
      revalidatePath("/", "layout");
    }

    console.log(`[WEBHOOK] Successfully revalidated for type: ${_type}`);
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    console.error("[WEBHOOK ERROR] Revalidation failed:", err);
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}
