import fs from 'fs';
import path from 'path';
import { SIGNATURE_COLLECTION } from '../src/data/products';
import { TESTIMONIALS } from '../src/data/testimonials';

let sql = '';

// Seed Products
for (const p of SIGNATURE_COLLECTION) {
  const pName = p.name.replace(/'/g, "''");
  const pSlug = p.slug.replace(/'/g, "''");
  const pCat = p.category.replace(/'/g, "''");
  const pWood = p.wood.replace(/'/g, "''");
  const pDim = p.dimensions.replace(/'/g, "''");
  const pImg = p.image.replace(/'/g, "''");
  const pDesc = p.description.replace(/'/g, "''");
  
  sql += `INSERT INTO "Product" ("id", "name", "slug", "category", "price", "comparePrice", "wood", "dimensions", "image", "description", "inStock", "featured", "updatedAt") 
VALUES ('${p.id}', '${pName}', '${pSlug}', '${pCat}', ${p.price}, ${p.comparePrice || 'NULL'}, '${pWood}', '${pDim}', '${pImg}', '${pDesc}', ${p.inStock}, ${p.featured}, NOW())
ON CONFLICT ("slug") DO NOTHING;\n`;
}

// Seed Testimonials
for (const t of TESTIMONIALS) {
  const tQuote = t.quote.replace(/'/g, "''");
  const tAuthor = t.author.replace(/'/g, "''");
  const tLoc = t.location.replace(/'/g, "''");
  const tPiece = t.piece.replace(/'/g, "''");
  
  sql += `INSERT INTO "Testimonial" ("id", "quote", "author", "location", "piece", "approved") 
VALUES ('${t.id}', '${tQuote}', '${tAuthor}', '${tLoc}', '${tPiece}', true)
ON CONFLICT DO NOTHING;\n`;
}

const outPath = path.join(__dirname, '../supabase/migrations/20260522000001_seed.sql');
fs.writeFileSync(outPath, sql, 'utf8');
console.log('Generated seed SQL at:', outPath);
