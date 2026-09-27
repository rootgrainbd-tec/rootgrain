import { notFound } from "next/navigation";
import { client } from "../../../../../sanity/lib/client";
import { DigitalCardView } from "@/components/digital-card/DigitalCardView";
import { Metadata } from "next";

export const revalidate = 60;

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPersonalCard(slug: string) {
  const query = `*[_type == "personalCard" && (slug.current == $slug || $slug in previousSlugs) && isActive == true][0] {
    fullName,
    preferredName,
    designation,
    organization,
    "photoUrl": profilePhoto.asset->url,
    "currentSlug": slug.current,
    shortIntroduction,
    phoneNumber,
    whatsappNumber,
    emailAddress,
    websiteUrl,
    linkedinUrl,
    instagramUrl,
    facebookUrl,
    officeAddress,
    seo
  }`;
  return client.fetch(query, { slug });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const card = await getPersonalCard(resolvedParams.slug);
  
  if (!card) return {};
  
  const displayName = card.preferredName || card.fullName;
  
  return {
    title: card.seo?.seoTitle || `${displayName} - Digital Business Card`,
    description: card.seo?.seoDescription || card.shortIntroduction,
    alternates: {
      canonical: `https://info.rootgrain.bd/c/${resolvedParams.slug}`,
    },
    openGraph: {
      title: card.seo?.seoTitle || `${displayName} - Digital Business Card`,
      description: card.seo?.seoDescription || card.shortIntroduction,
      images: card.photoUrl ? [{ url: card.photoUrl }] : undefined,
    }
  };
}

export default async function PersonalCardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const card = await getPersonalCard(resolvedParams.slug);

  if (!card) {
    notFound();
  }

  // Handle redirect if the requested slug is a previous slug
  if (card.currentSlug && card.currentSlug !== resolvedParams.slug) {
    const { redirect } = await import("next/navigation");
    redirect(`/info/c/${card.currentSlug}`);
  }

  const mappedData = {
    fullName: card.preferredName || card.fullName,
    designation: card.designation,
    organization: card.organization,
    photoUrl: card.photoUrl,
    shortIntroduction: card.shortIntroduction,
    phoneNumber: card.phoneNumber,
    whatsappNumber: card.whatsappNumber,
    emailAddress: card.emailAddress,
    websiteUrl: card.websiteUrl,
    linkedinUrl: card.linkedinUrl,
    instagramUrl: card.instagramUrl,
    facebookUrl: card.facebookUrl,
    officeAddress: card.officeAddress,
  };

  return <DigitalCardView type="personal" data={mappedData} />;
}
