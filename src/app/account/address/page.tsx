import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";

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
        <Button className="bg-[var(--primary)] hover:bg-[var(--gold)] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </Button>
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
            <Button variant="outline" className="border-[var(--primary)] text-[var(--primary)]">
              Add Your First Address
            </Button>
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
                <CardTitle className="text-lg text-[var(--walnut)]">{address.title || "Home"}</CardTitle>
                <CardDescription>{address.phone}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>
                    {address.city}, {address.postalCode}
                  </p>
                  <p>{address.country}</p>
                </div>
                <div className="flex space-x-3 mt-4 pt-4 border-t">
                  <Button variant="link" className="p-0 h-auto text-[var(--primary)]">Edit</Button>
                  <Button variant="link" className="p-0 h-auto text-red-500">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
