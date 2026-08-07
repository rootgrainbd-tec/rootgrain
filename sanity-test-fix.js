require('dotenv').config();
const { createClient } = require('next-sanity');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: false,
});

async function main() {
  const sanityConfig = await client.fetch(`*[_type == "siteSettings" && _id == "siteSettings"][0] {
    "logoUrl": logo.asset->url,
    "logoDarkUrl": logoDark.asset->url,
    "logoEmailUrl": logoEmail.asset->url,
    "logoSquareUrl": logoSquare.asset->url,
    "faviconUrl": favicon.asset->url,
    "ogImageUrl": ogImage.asset->url
  }`);
  
  const siteUrl = "https://rootgrain.bd";
  
  const siteConfig = {
    logoUrl: sanityConfig?.logoUrl || `${siteUrl}/images/rootgrain-logo.svg`,
    logoDarkUrl: sanityConfig?.logoDarkUrl || `${siteUrl}/images/rootgrain-logo-dark.svg`,
    logoEmailUrl: sanityConfig?.logoEmailUrl || sanityConfig?.logoUrl || `${siteUrl}/images/rootgrain-logo.png`,
  };

  const getEmailLogo = () => siteConfig.logoEmailUrl || siteConfig.logoUrl || "/images/rootgrain-logo.png";
  const getLogo = () => siteConfig.logoUrl || "/images/rootgrain-logo.svg";

  console.log("=== Verification Test Results ===");
  console.log("Sanity Config returned from CMS:", sanityConfig ? "HAS DATA" : "NULL");
  console.log("SiteConfig logoEmailUrl:", siteConfig.logoEmailUrl);
  console.log("SiteConfig logoUrl:", siteConfig.logoUrl);
  console.log("BrandService.getEmailLogo():", getEmailLogo());
  console.log("BrandService.getLogo() [Navbar]:", getLogo());
}

main().catch(console.error);
