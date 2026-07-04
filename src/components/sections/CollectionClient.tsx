"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Product, formatPrice } from "@/types/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function CollectionContent({ 
  products,
  totalPages,
  currentPage,
  uniqueCategories = [],
  uniqueWoods = [],
  title = "The Complete Collection",
  subtitle = "Our Catalog",
  basePath = "/collection"
}: { 
  products: Product[],
  totalPages: number,
  currentPage: number,
  uniqueCategories?: string[],
  uniqueWoods?: string[],
  title?: string,
  subtitle?: string,
  basePath?: string
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Create a query string with the updated parameter
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "All" || !value) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      // Reset to page 1 when changing a filter (but not when changing the page itself)
      if (name !== "page") {
        params.set("page", "1");
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    const queryString = createQueryString(name, value);
    router.push(`${pathname}?${queryString}`, { scroll: false });
  };

  const currentCategory = searchParams.get("category") || "All";
  const currentWood = searchParams.get("wood") || "All";
  const currentAvailability = searchParams.get("availability") || "All";
  const currentPrice = searchParams.get("price") || "All";

  // State for custom price range
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  useEffect(() => {
    if (currentPrice && currentPrice !== "All") {
      const [min, max] = currentPrice.split("-");
      setMinPrice(min || "");
      setMaxPrice(max || "");
    } else {
      setMinPrice("");
      setMaxPrice("");
    }
  }, [currentPrice]);

  const handleApplyPrice = () => {
    if (!minPrice && !maxPrice) {
      handleFilterChange("price", "All");
    } else {
      handleFilterChange("price", `${minPrice}-${maxPrice}`);
    }
    setIsPriceOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyPrice();
    }
  };

  // Generate pagination pages
  const getPageNumbers = () => {
    const pages = [];
    // Simple pagination logic for now (shows all pages if <= 5, else min/max)
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <section className="py-12 lg:py-24 bg-[var(--ivory)] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[var(--gold)] text-sm tracking-[0.4em] uppercase font-medium mb-4 block">
            {subtitle}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[var(--walnut-dark)] font-light mb-6">
            {title}
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent mx-auto" />
        </div>

        {/* Filter Bar */}
        <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between border-y border-[var(--walnut-light)]/20 py-4">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <span className="text-sm text-[var(--walnut)] font-medium uppercase tracking-wider mr-2">Filter By:</span>
            
            {/* Category Filter (Only show if uniqueCategories is provided, e.g., on the All Products page) */}
            {uniqueCategories.length > 0 && (
              <Select value={currentCategory} onValueChange={(val) => handleFilterChange("category", val)}>
                <SelectTrigger className="w-[180px] bg-transparent border-[var(--walnut-light)]/30 rounded-none text-[var(--walnut-dark)]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="All">All Categories</SelectItem>
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Wood Type Filter */}
            {uniqueWoods.length > 0 && (
              <Select value={currentWood} onValueChange={(val) => handleFilterChange("wood", val)}>
                <SelectTrigger className="w-[180px] bg-transparent border-[var(--walnut-light)]/30 rounded-none text-[var(--walnut-dark)]">
                  <SelectValue placeholder="Wood Type" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="All">All Woods</SelectItem>
                  {uniqueWoods.map(wood => (
                    <SelectItem key={wood} value={wood}>{wood}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Price Filter (Custom Input) */}
            <Popover open={isPriceOpen} onOpenChange={setIsPriceOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between font-normal bg-transparent border-[var(--walnut-light)]/30 rounded-none text-[var(--walnut-dark)] hover:bg-transparent">
                  {currentPrice !== "All" ? (
                    `৳${minPrice || '0'} - ${maxPrice ? `৳${maxPrice}` : 'Up'}`
                  ) : (
                    "Price Range"
                  )}
                  <span className="opacity-50">⌄</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-none p-4" align="start">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none text-[var(--walnut-dark)]">Custom Price Range</h4>
                    <p className="text-sm text-[var(--walnut-light)]">Enter minimum and maximum price.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="grid gap-1 flex-1">
                      <Input
                        id="minPrice"
                        placeholder="Min (৳)"
                        type="text"
                        inputMode="numeric"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value.replace(/\\D/g, ''))}
                        onKeyDown={handleKeyDown}
                        className="rounded-none border-[var(--walnut-light)]/30"
                      />
                    </div>
                    <span className="text-[var(--walnut-light)]">-</span>
                    <div className="grid gap-1 flex-1">
                      <Input
                        id="maxPrice"
                        placeholder="Max (৳)"
                        type="text"
                        inputMode="numeric"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value.replace(/\\D/g, ''))}
                        onKeyDown={handleKeyDown}
                        className="rounded-none border-[var(--walnut-light)]/30"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleApplyPrice}
                    className="w-full rounded-none bg-[var(--walnut-dark)] text-[var(--ivory)] hover:bg-[var(--gold)]"
                  >
                    Apply Filter
                  </Button>
                  {currentPrice !== "All" && (
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                        handleFilterChange("price", "All");
                        setIsPriceOpen(false);
                      }}
                      className="w-full rounded-none text-sm"
                    >
                      Clear Price
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Availability Filter */}
            <Select value={currentAvailability} onValueChange={(val) => handleFilterChange("availability", val)}>
              <SelectTrigger className="w-[180px] bg-transparent border-[var(--walnut-light)]/30 rounded-none text-[var(--walnut-dark)]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Made-to-Order">Made-to-Order</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
              </SelectContent>
            </Select>

          </div>

          <div className="text-sm text-[var(--walnut-light)] tracking-wide self-start md:self-auto">
            Page {currentPage} of {Math.max(1, totalPages)}
          </div>
        </div>

        {/* Product Grid */}
        <main>
          {products.length === 0 ? (
            <div className="text-center py-20 text-[var(--walnut-light)]">
              <p>No products found matching your filters.</p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-none border-[var(--walnut-light)]/30 text-[var(--walnut-dark)]"
                onClick={() => router.push(pathname)}
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[4/5] overflow-hidden mb-6 bg-[var(--parchment)]">
                    <Image
                      src={product.image || "/placeholder.jpg"}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10">
                      <span className="sr-only">View Details</span>
                    </Link>
                    <div className="absolute inset-0 bg-[var(--walnut-dark)]/0 group-hover:bg-[var(--walnut-dark)]/10 transition-colors duration-500" />
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <Button className="w-full bg-[var(--ivory)] text-[var(--walnut-dark)] hover:bg-[var(--gold)] rounded-none py-4 text-sm tracking-wider uppercase">
                        View Details
                      </Button>
                    </div>
                  </div>
                  <Link href={`/product/${product.slug}`}>
                    <span className="text-[var(--gold)] text-xs tracking-[0.2em] uppercase">
                      {product.category}
                    </span>
                    <h3 className="font-serif text-xl text-[var(--walnut-dark)] mt-1 mb-2 group-hover:text-[var(--oxblood)] transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between text-sm mt-3">
                      <span className="text-[var(--walnut)]">{product.wood}</span>
                      <span className="font-serif text-lg text-[var(--walnut-dark)]">{formatPrice(product.price)}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-12">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href={currentPage > 1 ? `${pathname}?${createQueryString("page", (currentPage - 1).toString())}` : "#"} 
                    className={currentPage === 1 ? "" : "pointer-events-none opacity-50"}
                  />
                </PaginationItem>
                
                {getPageNumbers().map(pageNum => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink 
                      href={`${pathname}?${createQueryString("page", pageNum.toString())}`}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext 
                    href={currentPage < totalPages ? `${pathname}?${createQueryString("page", (currentPage + 1).toString())}` : "#"} 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

        </main>
      </div>
    </section>
  );
}

export function CollectionClient(props: any) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--ivory)] text-[var(--walnut)]">Loading...</div>}>
      <CollectionContent {...props} />
    </Suspense>
  );
}
