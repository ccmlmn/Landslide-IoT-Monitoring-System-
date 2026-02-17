"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: ("admin" | "community")[];
  fallbackUrl?: string;
};

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackUrl = "/" 
}: RoleGuardProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded && user) {
      const userRole = (user.publicMetadata?.role as string) || "community";
      
      if (!allowedRoles.includes(userRole as any)) {
        router.push(fallbackUrl);
      }
    }
  }, [isLoaded, user, allowedRoles, fallbackUrl, router]);
  
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  const userRole = (user?.publicMetadata?.role as string) || "community";
  
  if (!allowedRoles.includes(userRole as any)) {
    return null;
  }
  
  return <>{children}</>;
}
