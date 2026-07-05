import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="py-16 border-t border-[var(--walnut-light)]/20">
      <h2 className="font-serif text-2xl text-[var(--walnut-dark)] mb-8">You May Also Like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((item) => (
          <Link 
            key={item.id} 
            href={`/product/${item.slug}`}
            className="group block"
          >
            <div className="relative aspect-square bg-[var(--parchment)] mb-4 overflow-hidden">
              <Image
                src={item.image}
                alt={item.name}
                fill
                className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h3 className="font-medium text-[var(--walnut-dark)] truncate">{item.name}</h3>
            <p className="text-sm text-[var(--walnut)] mt-1">৳{item.price.toLocaleString()}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
