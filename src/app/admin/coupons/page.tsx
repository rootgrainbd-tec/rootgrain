"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { formatPrice } from "@/types/product";

type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  isActive: boolean;
  maxUses: number | null;
  currentUses: number;
  expiryDate: string | null;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FLAT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (Array.isArray(data)) setCoupons(data);
    } catch (error) {
      console.error("Failed to fetch coupons", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return alert("Code and Value are required");

    let val = parseInt(discountValue);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue: val,
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        })
      });

      if (res.ok) {
        setCode("");
        setDiscountValue("");
        setMaxUses("");
        setExpiryDate("");
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create coupon");
      }
    } catch (error) {
      alert("Error creating coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
      fetchCoupons();
    } catch (error) {
      alert("Failed to delete coupon");
    }
  };

  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive })
      });
      fetchCoupons();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-8">Loading coupons...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Promo Codes & Coupons</h2>
        <p className="text-muted-foreground">Create and manage discount codes for your customers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Coupon</CardTitle>
          <CardDescription>Add a new discount code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code</Label>
                <Input id="code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. EID2026" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Discount Type</Label>
                <Select value={discountType} onValueChange={(val: any) => setDiscountType(val)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                    <SelectItem value="FLAT">Flat Amount (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Discount Value</Label>
                <Input id="value" type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder={discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 500"} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                <Input id="maxUses" type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Leave blank for unlimited" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                <Input id="expiry" type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
              </div>
            </div>
            <Button type="submit">Create Coupon</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 font-medium">Code</th>
                  <th className="p-3 font-medium">Discount</th>
                  <th className="p-3 font-medium">Uses</th>
                  <th className="p-3 font-medium">Expiry</th>
                  <th className="p-3 font-medium text-center">Status</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">No coupons created yet.</td>
                  </tr>
                ) : (
                  coupons.map(coupon => (
                    <tr key={coupon.id}>
                      <td className="p-3 font-bold">{coupon.code}</td>
                      <td className="p-3">
                        {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}
                      </td>
                      <td className="p-3">
                        {coupon.currentUses} / {coupon.maxUses || "∞"}
                      </td>
                      <td className="p-3">
                        {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : "Never"}
                      </td>
                      <td className="p-3 text-center">
                        <Switch checked={coupon.isActive} onCheckedChange={() => toggleStatus(coupon.id, coupon.isActive)} />
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
