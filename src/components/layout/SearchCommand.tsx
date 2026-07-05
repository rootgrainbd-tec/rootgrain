"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { urlForImage } from "../../../sanity/lib/image";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchProducts } from "@/actions/search";
import type { SanityProduct } from "@/types/sanity";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SanityProduct[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Implement debounce for search
    const timer = setTimeout(() => {
      if (query.trim() === "") {
        setResults([]);
        return;
      }
      startTransition(async () => {
        const products = await searchProducts(query);
        setResults(products);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
      commandProps={{ shouldFilter: false }}
    >
      <CommandInput 
        placeholder="Search for furniture, categories, or wood types..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isPending ? "Searching..." : "No products found."}
        </CommandEmpty>
        
        {results.length > 0 && (
          <CommandGroup heading="Products">
            {results.map((product) => (
              <CommandItem
                key={product._id}
                value={`${product.title} ${product.category?.name || ""} ${product.woodType || ""}`}
                onSelect={() => {
                  if (product.slug?.current) {
                    runCommand(() => router.push(`/product/${product.slug?.current}`));
                  }
                }}
                className="flex items-center gap-4 cursor-pointer"
              >
                {product.heroImage && (
                  <div className="relative w-12 h-12 rounded overflow-hidden shrink-0">
                    <Image
                      src={urlForImage(product.heroImage).width(100).height(100).url()}
                      alt={product.title || "Product image"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-serif text-lg text-[var(--walnut)]">{product.title}</span>
                  <span className="text-xs text-[var(--walnut-light)] uppercase tracking-wider">
                    {product.category?.name || "Furniture"}
                  </span>
                </div>
                <div className="ml-auto font-medium text-[var(--gold)]">
                  ${product.price}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
