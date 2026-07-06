"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { bdDivisions, bdDistricts } from "@/lib/bd-locations";

interface AddressDialogProps {
  variant?: "default" | "outline" | "link";
  label?: string;
  address?: {
    id: string;
    name: string;
    phone: string;
    division: string;
    district: string;
    street: string;
    postCode?: string | null;
    isDefault: boolean;
  };
}

export function AddressDialog({ variant = "default", label = "Add New", address }: AddressDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: address?.name || "",
    phone: address?.phone || "",
    division: address?.division || "",
    district: address?.district || "",
    street: address?.street || "",
    postCode: address?.postCode || "",
    isDefault: address?.isDefault || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      if (name === "division") {
        return { ...prev, division: value, district: "" }; // Reset district when division changes
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEditing = !!address;
      const res = await fetch(isEditing ? `/api/user/address/${address.id}` : "/api/user/address", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${isEditing ? "update" : "add"} address`);
      }

      toast.success(`Address ${isEditing ? "updated" : "added"} successfully!`);
      setIsOpen(false);
      
      // Only reset form if we're adding a new one, otherwise keep the edited values
      if (!isEditing) {
        setFormData({
          name: "",
          phone: "",
          division: "",
          district: "",
          street: "",
          postCode: "",
          isDefault: false,
        });
      }
      
      router.refresh();
    } catch (error) {
      toast.error(`Failed to ${address ? "update" : "add"} address. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === "outline" ? (
          <Button variant="outline" className="border-[var(--primary)] text-[var(--primary)]">
            {label}
          </Button>
        ) : variant === "link" ? (
          <Button variant="link" className="p-0 h-auto text-[var(--primary)]">
            {label}
          </Button>
        ) : (
          <Button className="bg-[var(--primary)] hover:bg-[var(--gold)] text-white">
            <Plus className="w-4 h-4 mr-2" />
            {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Address</DialogTitle>
          <DialogDescription>
            Enter your delivery address details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="01xxxxxxxxx"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              name="street"
              placeholder="House #, Street name, Apartment"
              value={formData.street}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="division">Division</Label>
              <Select 
                value={formData.division} 
                onValueChange={(value) => handleSelectChange("division", value)} 
                required
              >
                <SelectTrigger id="division">
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {bdDivisions.map((div) => (
                    <SelectItem key={div} value={div}>{div}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Select 
                value={formData.district} 
                onValueChange={(value) => handleSelectChange("district", value)} 
                required
                disabled={!formData.division}
              >
                <SelectTrigger id="district">
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {formData.division && bdDistricts[formData.division]?.map((dist) => (
                    <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postCode">Post Code</Label>
              <Input
                id="postCode"
                name="postCode"
                placeholder="1200"
                value={formData.postCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="isDefault" 
              checked={formData.isDefault}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked === true }))}
            />
            <Label htmlFor="isDefault" className="text-sm font-normal">
              Set as default address
            </Label>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-[var(--primary)] hover:bg-[var(--gold)] text-white">
              {loading ? "Saving..." : "Save Address"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
