import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { AddressDialog } from "@/components/account/AddressDialog";
import { AddressDeleteButton } from "@/components/account/AddressDeleteButton";

export const metadata = {
  title: "Address Book - Rootgrain",
  description: "Manage your delivery addresses",
};

export default async function AddressBookPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <div className="flex justify-center items-center h-48">
        <p>Please login to view your addresses.</p>
      </div>
    );
  }

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--walnut)]">Address Book</h2>
          <p className="text-muted-foreground">
            Manage your delivery and billing addresses.
          </p>
        </div>
        <AddressDialog />
      </div>

      {addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-[var(--walnut)]">No addresses found</h3>
            <p className="text-muted-foreground mt-2 mb-6 max-w-md">
              You haven't added any addresses yet. Add a delivery address to make checkout faster.
            </p>
            <AddressDialog variant="outline" label="Add Your First Address" />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              {address.isDefault && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-[var(--primary)] text-white text-xs font-medium rounded-tr-lg rounded-bl-lg">
                  Default
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-[var(--walnut)]">{address.name || "Home"}</CardTitle>
                <CardDescription>{address.phone}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>{address.street}</p>
                  <p>
                    {address.district}, {address.division}
                  </p>
                  <p>Bangladesh</p>
                </div>
                <div className="flex space-x-3 mt-4 pt-4 border-t">
                  <AddressDialog variant="link" label="Edit" address={address} />
                  <AddressDeleteButton id={address.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
