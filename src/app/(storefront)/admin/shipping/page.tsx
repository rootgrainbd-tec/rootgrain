"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, Truck } from "lucide-react";

const SHIPPING_TYPES = [
  { key: "small_1", label: "Small 1" },
  { key: "small_2", label: "Small 2" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
  { key: "bulky", label: "Bulky" },
] as const;

interface ShippingTypeRate {
  id: string;
  shippingType: string;
  baseRate: number;
  additionalRate: number;
}

interface RateFormState {
  baseRate: string;
  additionalRate: string;
}

export default function ShippingSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, RateFormState>>(() => {
    const initial: Record<string, RateFormState> = {};
    SHIPPING_TYPES.forEach((t) => {
      initial[t.key] = { baseRate: "", additionalRate: "" };
    });
    return initial;
  });

  const fetchRates = async () => {
    try {
      const res = await fetch("/api/admin/shipping-types");
      if (res.ok) {
        const payload = await res.json();
        const rates: ShippingTypeRate[] = payload.data?.rates || [];

        const updated: Record<string, RateFormState> = {};
        SHIPPING_TYPES.forEach((t) => {
          const existing = rates.find((r) => r.shippingType === t.key);
          updated[t.key] = {
            baseRate: existing ? existing.baseRate.toString() : "",
            additionalRate: existing ? existing.additionalRate.toString() : "",
          };
        });
        setFormState(updated);
      }
    } catch (error) {
      toast.error("Failed to fetch shipping type rates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleSave = async (shippingType: string) => {
    const form = formState[shippingType];
    if (!form.baseRate || !form.additionalRate) {
      toast.error("Please fill both Base Charge and Additional Item Charge");
      return;
    }

    setSavingType(shippingType);
    try {
      const res = await fetch("/api/admin/shipping-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingType,
          baseRate: parseInt(form.baseRate),
          additionalRate: parseInt(form.additionalRate),
        }),
      });

      if (res.ok) {
        const label = SHIPPING_TYPES.find((t) => t.key === shippingType)?.label;
        toast.success(`${label} rate saved!`);
      } else {
        toast.error("Failed to save rate");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSavingType(null);
    }
  };

  const handleChange = (shippingType: string, field: keyof RateFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [shippingType]: {
        ...prev[shippingType],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipping Settings</h1>
        <p className="text-muted-foreground">
          Configure nationwide shipping rates by product shipping type.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-[var(--walnut)]" />
            <CardTitle>Nationwide Shipping Rates</CardTitle>
          </div>
          <CardDescription>
            Set the base charge (first item) and additional item charge for each shipping type.
            These rates apply across all of Bangladesh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium w-[160px]">Shipping Type</th>
                    <th className="px-4 py-3 font-medium">Base Charge (BDT)</th>
                    <th className="px-4 py-3 font-medium">Additional Item (BDT)</th>
                    <th className="px-4 py-3 font-medium text-right w-[100px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {SHIPPING_TYPES.map((type) => (
                    <tr key={type.key} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium text-[var(--walnut-dark)]">
                        {type.label}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">৳</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="h-9 w-28"
                            value={formState[type.key].baseRate}
                            onChange={(e) => handleChange(type.key, "baseRate", e.target.value)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">৳</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="h-9 w-28"
                            value={formState[type.key].additionalRate}
                            onChange={(e) =>
                              handleChange(type.key, "additionalRate", e.target.value)
                            }
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSave(type.key)}
                          disabled={savingType === type.key}
                          className="bg-[var(--walnut-dark)] hover:bg-[var(--gold)] text-[var(--ivory)]"
                        >
                          {savingType === type.key ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
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
