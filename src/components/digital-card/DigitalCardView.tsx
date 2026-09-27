"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Phone, 
  Mail, 
  Globe, 
  Instagram, 
  Facebook, 
  Linkedin, 
  MapPin, 
  UserPlus, 
  MessageCircle 
} from "lucide-react";
import { saveContact, VCardData } from "@/lib/vcard";

export interface DigitalCardProps {
  type: "personal" | "general";
  data: {
    fullName?: string;
    brandName?: string;
    designation?: string;
    organization?: string;
    businessCategory?: string;
    photoUrl?: string;
    shortIntroduction?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    emailAddress?: string;
    websiteUrl?: string;
    linkedinUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    officeAddress?: string;
  };
}

export function DigitalCardView({ type, data }: DigitalCardProps) {
  const [isSaving, setIsSaving] = useState(false);

  const displayName = type === "personal" ? data.fullName : data.brandName;
  const subtitle = type === "personal" ? data.designation : data.businessCategory;
  const orgName = type === "personal" ? data.organization : data.organization || "RootGrain Artisan Furniture";

  const handleSaveContact = async () => {
    setIsSaving(true);
    try {
      const vcardData: VCardData = {
        fn: displayName || "Contact",
        org: orgName,
        title: type === "personal" ? data.designation : undefined,
        tel: data.phoneNumber,
        whatsapp: data.whatsappNumber,
        email: data.emailAddress,
        url: data.websiteUrl,
        adr: data.officeAddress,
        photoUrl: data.photoUrl,
      };

      const filename = (displayName || "Contact").replace(/\s+/g, "_").toLowerCase();
      await saveContact(vcardData, filename);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#2C2C2C] font-sans flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-[#EBEBEB]">
        {/* Header/Cover */}
        <div className="h-32 bg-[#3A332C] relative w-full flex items-center justify-center">
          {/* Subtle pattern or texture could go here */}
          {type === "general" && !data.photoUrl && (
            <span className="text-[#EBEBEB] text-2xl tracking-widest font-serif">{data.brandName?.toUpperCase()}</span>
          )}
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8 flex flex-col items-center text-center -mt-16">
          {data.photoUrl ? (
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white bg-white shadow-sm mb-4 relative">
              <Image 
                src={data.photoUrl} 
                alt={displayName || "Profile"} 
                fill 
                className="object-cover"
                sizes="128px"
              />
            </div>
          ) : (
            type === "personal" && (
              <div className="w-32 h-32 rounded-full border-4 border-white bg-[#EFEFEF] flex items-center justify-center shadow-sm mb-4">
                <span className="text-4xl text-[#999]">{displayName?.charAt(0)}</span>
              </div>
            )
          )}

          <h1 className="text-2xl font-serif mt-2 mb-1 text-[#1A1A1A]">{displayName}</h1>
          {subtitle && <p className="text-[#666666] font-medium tracking-wide text-sm mb-1">{subtitle}</p>}
          {type === "personal" && orgName && (
            <p className="text-[#888888] text-sm tracking-wider uppercase mb-4">{orgName}</p>
          )}

          {data.shortIntroduction && (
            <p className="text-[#555555] text-sm mt-3 mb-6 leading-relaxed max-w-[280px]">
              {data.shortIntroduction}
            </p>
          )}

          <button 
            onClick={handleSaveContact}
            disabled={isSaving}
            className="w-full bg-[#3A332C] text-white py-3.5 px-6 rounded-full font-medium tracking-wide shadow-md hover:bg-[#2C2721] transition-colors flex items-center justify-center gap-2 mb-8 disabled:opacity-70"
          >
            <UserPlus size={18} />
            {isSaving ? "Saving..." : "Save Contact"}
          </button>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            {data.phoneNumber && (
              <a href={`tel:${data.phoneNumber.replace(/[^+\d]/g, '')}`} className="flex items-center p-4 rounded-2xl bg-[#FBFBFB] hover:bg-[#F2F2F2] transition border border-[#F0F0F0] group text-left w-full">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#3A332C] mr-4 group-hover:scale-105 transition-transform">
                  <Phone size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#888] font-medium mb-0.5">Mobile</p>
                  <p className="text-sm font-medium text-[#2C2C2C]">{data.phoneNumber}</p>
                </div>
              </a>
            )}

            {data.whatsappNumber && (
              <a href={`https://wa.me/${data.whatsappNumber.replace(/[^+\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-2xl bg-[#FBFBFB] hover:bg-[#F2F2F2] transition border border-[#F0F0F0] group text-left w-full">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#25D366] mr-4 group-hover:scale-105 transition-transform">
                  <MessageCircle size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#888] font-medium mb-0.5">WhatsApp</p>
                  <p className="text-sm font-medium text-[#2C2C2C]">{data.whatsappNumber}</p>
                </div>
              </a>
            )}

            {data.emailAddress && (
              <a href={`mailto:${data.emailAddress}`} className="flex items-center p-4 rounded-2xl bg-[#FBFBFB] hover:bg-[#F2F2F2] transition border border-[#F0F0F0] group text-left w-full">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#3A332C] mr-4 group-hover:scale-105 transition-transform">
                  <Mail size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#888] font-medium mb-0.5">Email</p>
                  <p className="text-sm font-medium text-[#2C2C2C] truncate pr-2">{data.emailAddress}</p>
                </div>
              </a>
            )}

            {data.websiteUrl && (
              <a href={data.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-2xl bg-[#FBFBFB] hover:bg-[#F2F2F2] transition border border-[#F0F0F0] group text-left w-full">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#3A332C] mr-4 group-hover:scale-105 transition-transform">
                  <Globe size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-[#888] font-medium mb-0.5">Website</p>
                  <p className="text-sm font-medium text-[#2C2C2C] truncate pr-2">{data.websiteUrl.replace(/^https?:\/\//, '')}</p>
                </div>
              </a>
            )}

            {data.officeAddress && (
              <div className="flex items-start p-4 rounded-2xl bg-[#FBFBFB] border border-[#F0F0F0] text-left w-full">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#3A332C] mr-4 shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 mt-0.5">
                  <p className="text-xs text-[#888] font-medium mb-1">Address</p>
                  <p className="text-sm font-medium text-[#2C2C2C] leading-relaxed whitespace-pre-wrap">{data.officeAddress}</p>
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          {(data.instagramUrl || data.facebookUrl || data.linkedinUrl) && (
            <div className="mt-8 pt-6 border-t border-[#F0F0F0] w-full flex justify-center gap-4">
              {data.instagramUrl && (
                <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#3A332C] hover:bg-[#EBEBEB] transition">
                  <Instagram size={20} />
                </a>
              )}
              {data.facebookUrl && (
                <a href={data.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#3A332C] hover:bg-[#EBEBEB] transition">
                  <Facebook size={20} />
                </a>
              )}
              {data.linkedinUrl && (
                <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#3A332C] hover:bg-[#EBEBEB] transition">
                  <Linkedin size={20} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-xs text-[#999999]">
        <p>© {new Date().getFullYear()} RootGrain Artisan Furniture</p>
      </div>
    </div>
  );
}
