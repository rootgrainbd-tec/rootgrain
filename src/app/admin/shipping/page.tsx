"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Edit2, Plus, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bdDivisions, bdDistricts } from "@/lib/bd-locations";

interface ShippingRate {
  id: string;
  district: string;
  baseRate: number;
  perItemRate: number;
}

export default function ShippingSettingsPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [baseRate, setBaseRate] = useState("");
  const [perItemRate, setPerItemRate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/admin/shipping");
      if (res.ok) {
        const data = await res.json();
        setRates(data);
      }
    } catch (error) {
      toast.error("Failed to fetch shipping rates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!district || !baseRate || !perItemRate) {
      toast.error("Please fill all fields");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district,
          baseRate: parseInt(baseRate),
          perItemRate: parseInt(perItemRate)
        })
      });

      if (res.ok) {
        toast.success("Shipping rate saved!");
        setDistrict("");
        setBaseRate("");
        setPerItemRate("");
        fetchRates();
      } else {
        toast.error("Failed to save rate");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rate?")) return;
    
    try {
      const res = await fetch(`/api/admin/shipping?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted successfully");
        fetchRates();
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleEdit = (rate: ShippingRate) => {
    // Find the division for this district
    let foundDiv = "";
    for (const div of bdDivisions) {
      if (bdDistricts[div]?.includes(rate.district)) {
        foundDiv = div;
        break;
      }
    }
    setDivision(foundDiv);
    setDistrict(rate.district);
    setBaseRate(rate.baseRate.toString());
    setPerItemRate(rate.perItemRate.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipping Settings</h1>
        <p className="text-muted-foreground">Manage dynamic shipping rates per district.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add / Edit Rate</CardTitle>
          <CardDescription>Enter the district name and the corresponding delivery charges in BDT.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-2 flex-1 min-w-[150px]">
              <Label htmlFor="division">Division</Label>
              <Select value={division} onValueChange={(val) => { setDivision(val); setDistrict(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Division" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {bdDivisions.map(div => (
                    <SelectItem key={div} value={div}>{div}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1 min-w-[150px]">
              <Label htmlFor="district">District</Label>
              <Select value={district} onValueChange={setDistrict} disabled={!division}>
                <SelectTrigger>
                  <SelectValue placeholder="Select District" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  {division && bdDistricts[division]?.map(dist => (
                    <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="baseRate">Base Charge (BDT) - 1st item</Label>
              <Input 
                id="baseRate" 
                type="number"
                value={baseRate} 
                onChange={(e) => setBaseRate(e.target.value)} 
                placeholder="500"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="perItemRate">Extra Charge (BDT) - per item</Label>
              <Input 
                id="perItemRate" 
                type="number"
                value={perItemRate} 
                onChange={(e) => setPerItemRate(e.target.value)} 
                placeholder="100"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Save Rate
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configured Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : rates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No shipping rates configured yet.</p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">District</th>
                    <th className="px-4 py-3 font-medium">Base Charge (BDT)</th>
                    <th className="px-4 py-3 font-medium">Extra Per Item (BDT)</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{rate.district}</td>
                      <td className="px-4 py-3">৳{rate.baseRate.toLocaleString()}</td>
                      <td className="px-4 py-3">৳{rate.perItemRate.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(rate)}>
                          <Edit2 className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(rate.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
