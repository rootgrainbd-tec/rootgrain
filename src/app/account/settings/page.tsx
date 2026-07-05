import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-[var(--walnut)]">Profile Settings</h1>
        <p className="text-[var(--walnut-light)] mt-2">
          Manage your account details and preferences.
        </p>
      </div>

      <Card className="border-[var(--walnut)]/20 shadow-sm max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-serif text-[var(--walnut)]">Personal Information</CardTitle>
          <CardDescription>Update your name and phone number.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[var(--walnut)]">Full Name</Label>
              <Input 
                id="name" 
                defaultValue={user?.name || ""} 
                className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--walnut)]">Email Address</Label>
              <Input 
                id="email" 
                value={user?.email || ""} 
                disabled 
                className="bg-gray-50 border-[var(--walnut)]/30"
              />
              <p className="text-xs text-gray-500">Email cannot be changed. Contact support if needed.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[var(--walnut)]">Phone Number</Label>
              <Input 
                id="phone" 
                defaultValue={user?.phone || ""} 
                placeholder="+880 1..."
                className="border-[var(--walnut)]/30 focus-visible:ring-[var(--gold)]"
              />
            </div>
            <div className="pt-4">
              <Button type="button" className="bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white">
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
