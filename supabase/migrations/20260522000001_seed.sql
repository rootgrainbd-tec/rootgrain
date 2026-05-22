INSERT INTO "Product" ("id", "name", "slug", "category", "price", "comparePrice", "wood", "dimensions", "image", "description", "inStock", "featured", "updatedAt") 
VALUES ('heritage-dining-table', 'The Heritage Dining Table', 'heritage-dining-table', 'dining-tables', 48000000, NULL, 'American Black Walnut', '84" L × 42" W × 30" H', '/images/product-dining-table.png', 'A centerpiece for gathering, crafted with sweeping grain patterns and sculptural organic edges.', true, true, NOW())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Product" ("id", "name", "slug", "category", "price", "comparePrice", "wood", "dimensions", "image", "description", "inStock", "featured", "updatedAt") 
VALUES ('artisan-coffee-table', 'The Artisan Coffee Table', 'artisan-coffee-table', 'coffee-tables', 22000000, NULL, 'White Oak', '48" L × 24" W × 16" H', '/images/product-coffee-table.png', 'Low and elegant, with rounded edges that soften any living space.', true, true, NOW())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Product" ("id", "name", "slug", "category", "price", "comparePrice", "wood", "dimensions", "image", "description", "inStock", "featured", "updatedAt") 
VALUES ('heritage-chair', 'The Heritage Chair', 'heritage-chair', 'seating', 16000000, NULL, 'Walnut', '22" W × 20" D × 34" H', '/images/product-chair.png', 'Ergonomic comfort meets timeless design, with visible joinery and hand-shaped spindles.', true, true, NOW())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Product" ("id", "name", "slug", "category", "price", "comparePrice", "wood", "dimensions", "image", "description", "inStock", "featured", "updatedAt") 
VALUES ('sculptural-bench', 'The Sculptural Bench', 'sculptural-bench', 'seating', 24000000, NULL, 'Walnut', '60" L × 16" D × 18" H', '/images/product-bench.png', 'A statement piece for entryways or dining spaces, with fluid organic form.', true, true, NOW())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Product" ("id", "name", "slug", "category", "price", "comparePrice", "wood", "dimensions", "image", "description", "inStock", "featured", "updatedAt") 
VALUES ('tea-table', 'The Tea Table', 'tea-table', 'tables', 18000000, NULL, 'Cherry', '36" L × 24" W × 14" H', '/images/product-tea-table.png', 'Low and refined, perfect for quiet moments and intimate gatherings.', true, true, NOW())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Product" ("id", "name", "slug", "category", "price", "comparePrice", "wood", "dimensions", "image", "description", "inStock", "featured", "updatedAt") 
VALUES ('console-table', 'The Console Table', 'console-table', 'consoles', 20000000, NULL, 'White Oak', '48" L × 14" D × 32" H', '/images/product-console.png', 'Architectural elegance for hallways and entryways, with clean lines and warm presence.', true, true, NOW())
ON CONFLICT ("slug") DO NOTHING;
INSERT INTO "Testimonial" ("id", "quote", "author", "location", "piece", "approved") 
VALUES ('undefined', 'Our dining table has become the heart of our home. Every meal feels special when gathered around something made with such care and intention. The wood grain tells a story, and now our family does too.', 'Sarah & James Morrison', 'Portland, Oregon', 'Heritage Dining Table', true)
ON CONFLICT DO NOTHING;
INSERT INTO "Testimonial" ("id", "quote", "author", "location", "piece", "approved") 
VALUES ('undefined', 'In a world of disposable furniture, finding RootGrain was like discovering a treasure. The bench we purchased will outlive us all, and that''s exactly the point. This is furniture as it should be.', 'David Chen', 'San Francisco, California', 'Sculptural Bench', true)
ON CONFLICT DO NOTHING;
INSERT INTO "Testimonial" ("id", "quote", "author", "location", "piece", "approved") 
VALUES ('undefined', 'The coffee table is stunning—elegant yet approachable, refined yet warm. But what I love most is knowing the hands that shaped it. There''s soul in every curve.', 'Emma Thompson', 'Austin, Texas', 'Artisan Coffee Table', true)
ON CONFLICT DO NOTHING;
