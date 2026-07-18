"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MessageCircle, Mail } from "lucide-react";

interface InquiryDialogProps {
  product: {
    id: string;
    name: string;
  };
}

export function InquiryDialog({ product }: InquiryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: `Hello RootGrain, I want to inquire about the product: ${product.name}`,
  });

  const productUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappNumber = "8801632300103"; 

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hello RootGrain, I want to inquire about the product: ${product.name}\nLink: ${productUrl}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          productId: product.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit inquiry");

      toast.success("Inquiry submitted successfully! We will contact you soon.");
      setIsOpen(false);
      setFormData({
        name: "",
        phone: "",
        message: `Hello RootGrain, I want to inquire about the product: ${product.name}`,
      });
    } catch (error) {
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1 bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] py-8 text-sm tracking-widest uppercase transition-colors rounded-none">
          Inquire / Custom Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[var(--ivory)] border-[var(--walnut-light)]/20">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[var(--walnut-dark)] font-light">
            Inquire About {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <Button 
            onClick={handleWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-6 rounded-none flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--walnut-light)]/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-[var(--ivory)] px-2 text-[var(--walnut-light)]">Or send a message</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[var(--walnut-dark)] text-sm">Full Name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="rounded-none border-[var(--walnut-light)]/30 focus-visible:ring-[var(--gold)] bg-transparent"
                placeholder="John Doe"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[var(--walnut-dark)] text-sm">Phone Number</Label>
              <Input
                id="phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-none border-[var(--walnut-light)]/30 focus-visible:ring-[var(--gold)] bg-transparent"
                placeholder="+880 1XX XXX XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-[var(--walnut-dark)] text-sm">Message</Label>
              <Textarea
                id="message"
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="rounded-none border-[var(--walnut-light)]/30 focus-visible:ring-[var(--gold)] bg-transparent min-h-[100px]"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] py-6 text-sm tracking-widest uppercase transition-colors rounded-none mt-2"
            >
              {isSubmitting ? "Sending..." : "Submit Request"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
