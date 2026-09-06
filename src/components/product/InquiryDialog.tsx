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
  whatsappNumber: string;
  triggerText?: string;
}

export function InquiryDialog({ product, whatsappNumber, triggerText = "Inquire / Custom Order" }: InquiryDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: `Hello RootGrain, I want to inquire about the product: ${product.name}`,
  });

  const productUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hello RootGrain, I want to inquire about the product: ${product.name}\nLink: ${productUrl}`);
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, "_blank");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form view when modal closes
      setTimeout(() => setShowEmailForm(false), 200);
    }
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
      setShowEmailForm(false);
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full h-full bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] py-8 text-sm tracking-widest uppercase transition-colors rounded-none">
          {triggerText}
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md bg-[var(--ivory)] border-[var(--walnut-light)]/20 p-6">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[var(--walnut-dark)] font-light text-center">
            {showEmailForm ? "Send an Inquiry" : "INQUIRE"}
          </DialogTitle>
        </DialogHeader>

        {!showEmailForm ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="text-center mb-2">
              <p className="text-[var(--walnut-dark)] text-sm">Have a question about this piece?</p>
            </div>

            <Button 
              onClick={handleWhatsApp}
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-6 rounded-none flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Chat on WhatsApp
            </Button>

            <Button 
              onClick={() => setShowEmailForm(true)}
              variant="outline"
              className="w-full border-[var(--walnut-light)] text-[var(--walnut-dark)] hover:border-[var(--gold)] hover:text-[var(--gold)] py-6 rounded-none flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Send an Inquiry
            </Button>

            <div className="mt-4 text-center border-t border-[var(--walnut-light)]/20 pt-6">
              <p className="text-xs text-[var(--walnut-light)] mb-2 uppercase tracking-widest">Custom requirements?</p>
              <a href={`/custom-request?productId=${product.id}`} className="text-sm font-medium text-[var(--walnut-dark)] hover:text-[var(--gold)] transition-colors inline-flex items-center">
                Start a custom request &rarr;
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
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

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowEmailForm(false)}
                  className="flex-1 py-6 border-[var(--walnut-light)] text-[var(--walnut-dark)] hover:border-[var(--gold)] hover:text-[var(--gold)] rounded-none transition-colors"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-6 bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)] text-sm tracking-widest uppercase transition-colors rounded-none"
                >
                  {isSubmitting ? "Sending..." : "Submit"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
