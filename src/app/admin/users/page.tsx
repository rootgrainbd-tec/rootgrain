import prisma from "@/lib/prisma";
import { format } from "date-fns";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { id: "desc" }, // No createdAt field in User model right now, ordering by id
  });

  return (
    <div>
      <h1 className="text-2xl font-serif text-[var(--walnut-dark)] mb-6">Registered Customers</h1>
      
      <div className="bg-white rounded-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--walnut-light)]/20">
              <th className="p-4 font-serif text-[var(--walnut-dark)]">Name</th>
              <th className="p-4 font-serif text-[var(--walnut-dark)]">Email</th>
              <th className="p-4 font-serif text-[var(--walnut-dark)]">Phone</th>
              <th className="p-4 font-serif text-[var(--walnut-dark)]">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[var(--walnut-light)]">
                  No customers found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-[var(--walnut-light)]/10 hover:bg-[var(--cream)]">
                  <td className="p-4 text-sm font-medium">{user.name || "-"}</td>
                  <td className="p-4 text-sm">{user.email || "-"}</td>
                  <td className="p-4 text-sm">{user.phone || "-"}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'ADMIN' ? 'bg-[var(--gold)] text-white' : 'bg-[var(--parchment)] text-[var(--walnut)]'}`}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
