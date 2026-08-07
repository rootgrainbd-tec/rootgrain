"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateStoreSettings } from "@/app/actions/admin";

interface SettingsFormProps {
  initialDelay: number;
  initialDiscount: number;
}

export function SettingsForm({ initialDelay, initialDiscount }: SettingsFormProps) {
  const [delay, setDelay] = useState(initialDelay);
  const [discount, setDiscount] = useState(initialDiscount);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    const res = await updateStoreSettings(delay, discount);
    if (res.success) {
      toast.success("Settings updated successfully!");
    } else {
      toast.error(res.error || "Failed to update settings");
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-1">Delay (Hours)</label>
          <Input 
            type="number" 
            value={delay} 
            onChange={(e) => setDelay(Number(e.target.value))} 
            min={1}
            max={72}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Discount (%)</label>
          <Input 
            type="number" 
            value={discount} 
            onChange={(e) => setDiscount(Number(e.target.value))} 
            min={0}
            max={100}
          />
        </div>
      </div>
      <Button 
        onClick={handleSave} 
        disabled={isLoading}
        className="bg-[var(--walnut)] text-white hover:bg-[var(--gold)]"
      >
        {isLoading ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
