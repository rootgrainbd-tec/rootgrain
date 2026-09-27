"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Phone, 
  Mail, 
  Globe, 
  Instagram, 
  Facebook, 
  Linkedin, 
  MapPin, 
  UserPlus, 
  MessageCircle,
  ArrowLeft,
  ChevronRight
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
    founders?: Array<{
      currentSlug: string;
      fullName: string;
      preferredName?: string;
      designation?: string;
      photoUrl?: string;
      shortIntroduction?: string;
    }>;
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
    <div className="min-h-[100dvh] bg-[#FAF9F6] text-[#2C2C2C] font-sans flex flex-col items-center py-6 sm:py-12 px-4 sm:px-6 w-full">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-[#E8E6E1] flex flex-col relative">
        
        {/* Header/Cover */}
        <div className="h-40 bg-gradient-to-br from-[#2D332D] to-[#1F241F] relative w-full flex items-center justify-center">
          {type === "personal" && (
            <Link 
              href="/info" 
              className="absolute top-6 left-6 text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors z-10 bg-black/20 backdrop-blur-md py-1.5 px-3 rounded-full"
            >
              <ArrowLeft size={16} />
              RootGrain
            </Link>
          )}
          {/* Decorative Pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent mix-blend-overlay"></div>
        </div>

        {/* Profile Info */}
        <div className="px-6 sm:px-8 pb-10 flex flex-col items-center text-center -mt-16 relative z-10">
          {data.photoUrl ? (
            <div className="w-32 h-32 rounded-full overflow-hidden border-[6px] border-white bg-white shadow-md mb-5 relative">
              <Image 
                src={data.photoUrl} 
                alt={displayName || "Profile"} 
                fill 
                className="object-cover"
                sizes="128px"
                priority
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full border-[6px] border-white bg-[#F3F1EC] flex items-center justify-center shadow-md mb-5 text-[#2D332D]">
              {type === "general" ? (
                <span className="text-xl tracking-widest font-serif px-2 leading-tight">ROOTGRAIN</span>
              ) : (
                <span className="text-4xl font-serif">{displayName?.charAt(0)}</span>
              )}
            </div>
          )}

          <h1 className="text-[26px] font-serif mt-1 mb-1 text-[#1A1A1A] leading-tight">{displayName}</h1>
          {subtitle && <p className="text-[#5C5C5C] font-medium tracking-wide text-[15px] mb-2">{subtitle}</p>}
          
          {type === "personal" && orgName && (
            <p className="text-[#8C8982] text-xs tracking-[0.2em] uppercase font-semibold mb-5">{orgName}</p>
          )}

          {data.shortIntroduction && (
            <p className="text-[#4A4A4A] text-[15px] mt-2 mb-7 leading-relaxed max-w-[280px]">
              {data.shortIntroduction}
            </p>
          )}

          <button 
            onClick={handleSaveContact}
            disabled={isSaving}
            className="w-full bg-[#2D332D] text-white py-4 px-6 rounded-2xl font-medium tracking-wide shadow-[0_4px_14px_rgba(45,51,45,0.25)] hover:bg-[#1F241F] transition-all flex items-center justify-center gap-2.5 mb-8 disabled:opacity-70 active:scale-[0.98] cursor-pointer"
          >
            <UserPlus size={18} />
            {isSaving ? "Saving..." : "Save Contact"}
          </button>

          {/* Action Links Container */}
          <div className="w-full space-y-3.5">
            {data.phoneNumber && (
              <a href={`tel:${data.phoneNumber.replace(/[^+\d]/g, '')}`} className="flex items-center p-4 rounded-2xl bg-[#FAF9F6] hover:bg-[#F3F1EC] transition-colors border border-[#E8E6E1] group text-left w-full shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#2D332D] mr-4 shrink-0 group-hover:scale-105 transition-transform border border-[#F0EFEA]">
                  <Phone size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#8C8982] font-semibold tracking-wider uppercase mb-0.5">Mobile</p>
                  <p className="text-[15px] font-medium text-[#2C2C2C] truncate">{data.phoneNumber}</p>
                </div>
              </a>
            )}

            {data.whatsappNumber && (
              <a href={`https://wa.me/${data.whatsappNumber.replace(/[^+\d]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-2xl bg-[#FAF9F6] hover:bg-[#F3F1EC] transition-colors border border-[#E8E6E1] group text-left w-full shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#25D366] mr-4 shrink-0 group-hover:scale-105 transition-transform border border-[#F0EFEA]">
                  <MessageCircle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#8C8982] font-semibold tracking-wider uppercase mb-0.5">WhatsApp</p>
                  <p className="text-[15px] font-medium text-[#2C2C2C] truncate">{data.whatsappNumber}</p>
                </div>
              </a>
            )}

            {data.emailAddress && (
              <a href={`mailto:${data.emailAddress}`} className="flex items-center p-4 rounded-2xl bg-[#FAF9F6] hover:bg-[#F3F1EC] transition-colors border border-[#E8E6E1] group text-left w-full shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#2D332D] mr-4 shrink-0 group-hover:scale-105 transition-transform border border-[#F0EFEA]">
                  <Mail size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#8C8982] font-semibold tracking-wider uppercase mb-0.5">Email</p>
                  <p className="text-[15px] font-medium text-[#2C2C2C] truncate pr-2">{data.emailAddress}</p>
                </div>
              </a>
            )}

            {data.websiteUrl && (
              <a href={data.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 rounded-2xl bg-[#FAF9F6] hover:bg-[#F3F1EC] transition-colors border border-[#E8E6E1] group text-left w-full shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#2D332D] mr-4 shrink-0 group-hover:scale-105 transition-transform border border-[#F0EFEA]">
                  <Globe size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#8C8982] font-semibold tracking-wider uppercase mb-0.5">Website</p>
                  <p className="text-[15px] font-medium text-[#2C2C2C] truncate pr-2">{data.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
                </div>
              </a>
            )}

            {data.officeAddress && (
              <div className="flex items-start p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E6E1] text-left w-full shadow-sm">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#2D332D] mr-4 shrink-0 border border-[#F0EFEA]">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0 mt-0.5">
                  <p className="text-[11px] text-[#8C8982] font-semibold tracking-wider uppercase mb-1">Address</p>
                  <p className="text-[15px] font-medium text-[#2C2C2C] leading-relaxed whitespace-pre-wrap">{data.officeAddress}</p>
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          {(data.instagramUrl || data.facebookUrl || data.linkedinUrl) && (
            <div className="mt-8 pt-6 border-t border-[#E8E6E1] w-full flex justify-center gap-5">
              {data.instagramUrl && (
                <a href={data.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E8E6E1] flex items-center justify-center text-[#2D332D] hover:bg-[#F3F1EC] hover:scale-105 transition-all shadow-sm">
                  <Instagram size={20} />
                </a>
              )}
              {data.facebookUrl && (
                <a href={data.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E8E6E1] flex items-center justify-center text-[#2D332D] hover:bg-[#F3F1EC] hover:scale-105 transition-all shadow-sm">
                  <Facebook size={20} />
                </a>
              )}
              {data.linkedinUrl && (
                <a href={data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E8E6E1] flex items-center justify-center text-[#2D332D] hover:bg-[#F3F1EC] hover:scale-105 transition-all shadow-sm">
                  <Linkedin size={20} />
                </a>
              )}
            </div>
          )}

          {/* Founders & Leadership Section (Only for General Card) */}
          {type === "general" && data.founders && data.founders.length > 0 && (
            <div className="w-full mt-10 text-left">
              <h2 className="text-xl font-serif text-[#1A1A1A] mb-4 text-center">Our Founders</h2>
              <div className="space-y-3.5">
                {data.founders.map((founder) => (
                  <Link 
                    key={founder.currentSlug} 
                    href={`/info/c/${founder.currentSlug}`}
                    className="flex items-center p-3.5 rounded-2xl bg-white hover:bg-[#FAF9F6] transition-colors border border-[#E8E6E1] group shadow-sm"
                  >
                    {founder.photoUrl ? (
                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 mr-4 border border-[#F0EFEA]">
                        <Image 
                          src={founder.photoUrl} 
                          alt={founder.preferredName || founder.fullName} 
                          width={56} 
                          height={56} 
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#F3F1EC] flex items-center justify-center shrink-0 mr-4 border border-[#F0EFEA] text-[#2D332D]">
                        <span className="text-lg font-serif">{(founder.preferredName || founder.fullName).charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[16px] font-medium text-[#1A1A1A] truncate">{founder.preferredName || founder.fullName}</p>
                      {founder.designation && <p className="text-[13px] text-[#5C5C5C] truncate mt-0.5">{founder.designation}</p>}
                    </div>
                    <div className="text-[#8C8982] group-hover:text-[#2D332D] transition-colors group-hover:translate-x-1 duration-300">
                      <ChevronRight size={20} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 mb-4 text-center text-xs text-[#8C8982] font-medium tracking-wide">
        <p>© {new Date().getFullYear()} RootGrain Artisan Furniture</p>
      </div>
    </div>
  );
}
