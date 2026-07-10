import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const settings = await prisma.storeSettings.findFirst();
  const delay = settings?.abandonedCartDelayHours || 24;
  const discount = settings?.abandonedCartDiscountPercent || 5;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif text-[var(--walnut-dark)]">Admin Settings</h1>
      
      <div className="bg-white p-6 rounded-sm border shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-[var(--walnut)] border-b pb-2">Abandoned Cart Recovery</h2>
        <p className="text-sm text-gray-500 mb-4">
          Automatically send an email to users who leave their cart without completing the order.
          Configure the delay before sending the email and the discount percentage to offer them.
        </p>
        
        <SettingsForm initialDelay={delay} initialDiscount={discount} />
      </div>

      <div className="bg-white p-6 rounded-sm border shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-[var(--walnut)] border-b pb-2">Global Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Maintenance Mode</label>
            <p className="text-sm text-gray-500 mb-2">Enable this to show a maintenance page to regular users.</p>
            <Button variant="outline">Enable Maintenance Mode</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
