"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { toggleMaintenanceMode } from "@/app/actions/admin";
import { Loader2 } from "lucide-react";

export function MaintenanceToggle({ initialState }: { initialState: boolean }) {
  const [isMaintenance, setIsMaintenance] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    const newState = !isMaintenance;
    const res = await toggleMaintenanceMode(newState);
    
    if (res.success) {
      setIsMaintenance(newState);
      toast.success(newState ? "Maintenance Mode enabled!" : "Maintenance Mode disabled!");
    } else {
      toast.error(res.error || "Failed to toggle maintenance mode");
    }
    
    setIsLoading(false);
  };

  return (
    <Button 
      variant={isMaintenance ? "destructive" : "outline"}
      onClick={handleToggle}
      disabled={isLoading}
      className={isMaintenance ? "bg-red-600 hover:bg-red-700 text-white" : ""}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {isMaintenance ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
    </Button>
  );
}
