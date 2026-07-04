import { createClient } from 'next-sanity';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-03-20',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

async function uploadImage(filePath: string) {
  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${fullPath}`);
      return null;
    }
    const asset = await client.assets.upload('image', fs.createReadStream(fullPath), {
      filename: path.basename(filePath)
    });
    return asset._id;
  } catch (error) {
    console.error(`Failed to upload image ${filePath}:`, error);
    return null;
  }
}

async function seedSettings() {
  console.log('Starting Site Settings Migration...');
  
  // 1. Create Site Settings Document
  const settings = {
    _type: 'siteSettings',
    siteTitle: "RootGrain",
    tagline: "Artisan Furniture",
    description: "RootGrain crafts heirloom-quality wooden furniture using time-honored artisan techniques. Each piece tells a story of craftsmanship, permanence, and timeless beauty.",
    phone: "+88 01917389253",
    email: "rootgrainbd@gmail.com",
    hours: "Saturday - Thursday: 10 am - 11 pm",
    address: {
      line1: "Mujibnagar road, Rail Bazar",
      line2: "Darsana, Chuadanga"
    },
    socialLinks: {
      instagram: "https://instagram.com",
      facebook: "https://facebook.com",
      twitter: "https://twitter.com"
    },
    copyright: `© ${new Date().getFullYear()} RootGrain. All rights reserved.`,
    origin: "Crafted with legacy. Made in Bangladesh."
  };

  await client.create(settings);
  console.log('Created Site Settings Document');

  // 2. Patch Homepage with Lifestyle fields
  const homepageDocs = await client.fetch(`*[_type == "homepage"]{_id}`);
  if (homepageDocs.length > 0) {
    const homepageId = homepageDocs[0]._id;
    const lifestyleAssetId = await uploadImage('/images/lifestyle-interior.png');
    
    await client.patch(homepageId)
      .set({
        lifestyleTitle: "Lifestyle Interiors",
        lifestyleDescription: "Our furniture finds its home in spaces that value authenticity, warmth, and the quiet luxury of natural materials.",
        lifestyleSpace: "A Japandi Dining Room",
        lifestyleImage: lifestyleAssetId ? { _type: 'image', asset: { _type: 'reference', _ref: lifestyleAssetId } } : undefined
      })
      .commit();
    console.log('Patched Homepage with Lifestyle Data');
  } else {
    console.log('No homepage document found to patch.');
  }

  console.log('Migration Complete!');
}

seedSettings().catch(console.error);
