import React from 'react';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { MaintenanceScreen } from "./MaintenanceScreen";

export async function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || "";

  // Always allow access to login and authentication APIs
  if (currentPath.startsWith("/login") || currentPath.startsWith("/api/auth")) {
    return <>{children}</>;
  }

  try {
    const settings = await prisma.storeSettings.findFirst();
    
    if (settings?.maintenanceMode) {
      const session = await getServerSession(authOptions);
      
      // If user is not logged in or not an ADMIN, show Maintenance screen
      if (!session || (session.user as any).role !== "ADMIN") {
        return <MaintenanceScreen />;
      }
    }
  } catch (error) {
    console.error("Maintenance Guard Error:", error);
  }

  return <>{children}</>;
}
