import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { MtoCheckoutClient } from "./MtoCheckoutClient";
import { urlForImage } from "../../../../../sanity/lib/image";

export default async function MtoCheckoutPage({ searchParams }: { searchParams: Promise<{ productId?: string; qty?: string }> }) {
  const params = await searchParams;
  const { productId, qty } = params;

  if (!productId || !qty) {
    redirect("/collection");
  }

  const quantity = parseInt(qty, 10);
  if (isNaN(quantity) || quantity < 1) {
    redirect("/collection");
  }

  const product = await prisma.product.findUnique({
    where: { slug: productId }
  });

  if (!product || !product.isActive || !product.isMto) {
    notFound();
  }

  // Need to get the image from somewhere. We can just use the placeholder or pass the heroUrl if Prisma doesn't have the fully resolved sanity image.
  // Actually, Prisma product has an 'image' field, but Sanity has 'heroImage'. Let's check prisma schema: `image String`.
  
  const mtoItem = {
    id: product.slug,
    name: product.name,
    price: product.price,
    image: product.image || "/placeholder.jpg",
    quantity: quantity,
  };

  return (
    <MtoCheckoutClient item={mtoItem} baseLeadTimeDays={product.baseLeadTimeDays} additionalUnitLeadTimeDays={product.additionalUnitLeadTimeDays} />
  );
}
