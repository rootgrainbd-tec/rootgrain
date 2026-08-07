require('dotenv').config();
const { createClient } = require('next-sanity');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: false,
});

async function main() {
  const data = await client.fetch(`*[_type == "siteSettings"][0] {
    "logoUrl": logo.asset->url,
    "logoDarkUrl": logoDark.asset->url,
    "logoEmailUrl": logoEmail.asset->url,
    "logoSquareUrl": logoSquare.asset->url,
    "faviconUrl": favicon.asset->url,
    "ogImageUrl": ogImage.asset->url
  }`);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
