import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-serif text-[var(--walnut-dark)]">Admin Settings</h1>
      
      <div className="bg-white p-6 rounded-sm border shadow-sm space-y-4">
        <h2 className="text-lg font-medium text-[var(--walnut)] border-b pb-2">Global Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Maintenance Mode</label>
            <p className="text-sm text-gray-500 mb-2">Enable this to show a maintenance page to regular users.</p>
            <Button variant="outline">Enable Maintenance Mode</Button>
          </div>

          <div className="pt-4 border-t">
            <label className="block text-sm font-medium mb-1">Order Notifications Email</label>
            <p className="text-sm text-gray-500 mb-2">Email address to receive new order notifications.</p>
            <div className="flex gap-2 max-w-md">
              <input type="email" defaultValue="admin@rootgrain.com" className="flex-1 px-3 py-2 border rounded-sm text-sm" />
              <Button className="bg-[var(--walnut)] text-white hover:bg-[var(--gold)]">Save</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
