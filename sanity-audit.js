require('dotenv').config();
const { createClient } = require('next-sanity');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: false,
});

async function main() {
  const data = await client.fetch(`*[_type == "siteSettings"] {
    _id,
    _type,
    _updatedAt,
    _createdAt,
    "isPublished": !(_id in path("drafts.**")),
    siteTitle,
    "logo": logo.asset-> {
      _id,
      originalFilename,
      url,
      "dimensions": metadata.dimensions,
      extension
    },
    "logoEmail": logoEmail.asset-> {
      _id,
      originalFilename,
      url,
      "dimensions": metadata.dimensions,
      extension
    },
    "logoDark": logoDark.asset-> {
      _id,
      originalFilename,
      url,
      "dimensions": metadata.dimensions,
      extension
    },
    "logoSquare": logoSquare.asset-> {
      _id,
      originalFilename,
      url,
      "dimensions": metadata.dimensions,
      extension
    },
    "favicon": favicon.asset-> {
      _id,
      originalFilename,
      url,
      "dimensions": metadata.dimensions,
      extension
    },
    "ogImage": ogImage.asset-> {
      _id,
      originalFilename,
      url,
      "dimensions": metadata.dimensions,
      extension
    }
  }`);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
