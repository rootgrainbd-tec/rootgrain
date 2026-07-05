import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/account/ProfileForm";

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
          <ProfileForm user={user!} />
        </CardContent>
      </Card>
    </div>
  );
}
