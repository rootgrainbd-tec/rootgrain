import { notFound } from "next/navigation";
import { client } from "../../../sanity/lib/client";
import { DigitalCardView } from "@/components/digital-card/DigitalCardView";
import { Metadata } from "next";

export const revalidate = 60; // revalidate every minute

async function getGeneralCard() {
  const query = `*[_type == "generalCard" && isActive == true][0] {
    brandName,
    businessCategory,
    "photoUrl": logo.asset->url,
    shortDescription,
    businessPhone,
    whatsappNumber,
    businessEmail,
    website,
    instagram,
    facebook,
    linkedin,
    businessAddress,
    seo
  }`;
  return client.fetch(query);
}

export async function generateMetadata(): Promise<Metadata> {
  const card = await getGeneralCard();
  if (!card) return {};
  
  return {
    title: card.seo?.seoTitle || `${card.brandName || 'RootGrain'} - Digital Business Card`,
    description: card.seo?.seoDescription || card.shortDescription,
    alternates: {
      canonical: 'https://info.rootgrain.bd/',
    },
    openGraph: {
      title: card.seo?.seoTitle || `${card.brandName || 'RootGrain'} - Digital Business Card`,
      description: card.seo?.seoDescription || card.shortDescription,
      images: card.photoUrl ? [{ url: card.photoUrl }] : undefined,
    }
  };
}

export default async function GeneralCardPage() {
  const card = await getGeneralCard();

  if (!card) {
    notFound();
  }

  const mappedData = {
    brandName: card.brandName,
    businessCategory: card.businessCategory,
    photoUrl: card.photoUrl,
    shortIntroduction: card.shortDescription,
    phoneNumber: card.businessPhone,
    whatsappNumber: card.whatsappNumber,
    emailAddress: card.businessEmail,
    websiteUrl: card.website,
    instagramUrl: card.instagram,
    facebookUrl: card.facebook,
    linkedinUrl: card.linkedin,
    officeAddress: card.businessAddress,
  };

  return <DigitalCardView type="general" data={mappedData} />;
}
