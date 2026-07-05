import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AddressBookPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) return null;

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--walnut)]">Address Book</h1>
          <p className="text-[var(--walnut-light)] mt-2">
            Manage your shipping and billing addresses.
          </p>
        </div>
        <Button className="bg-[var(--walnut)] hover:bg-[var(--walnut-light)] text-white">
          Add New Address
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {addresses.length > 0 ? (
          addresses.map((address) => (
            <Card key={address.id} className={`border-[var(--walnut)]/20 shadow-sm ${address.isDefault ? 'ring-2 ring-[var(--gold)]' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-serif text-[var(--walnut)]">{address.name}</CardTitle>
                  {address.isDefault && (
                    <span className="text-xs px-2 py-1 bg-[var(--gold)]/20 text-[var(--gold)] rounded-full">
                      Default
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-[var(--walnut-light)]">
                  <p>{address.street}</p>
                  <p>{address.district}, {address.division}</p>
                  <p className="pt-2 font-medium">Phone: {address.phone}</p>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button variant="outline" size="sm" className="border-[var(--walnut)]/30 text-[var(--walnut)]">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 bg-white rounded-lg border border-[var(--walnut)]/20 shadow-sm">
            <p className="text-[var(--walnut-light)] mb-4">You haven't saved any addresses yet.</p>
            <Button variant="outline" className="border-[var(--walnut)]/30 text-[var(--walnut)]">
              Add your first address
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
