import { auth, currentUser } from "@clerk/nextjs/server";

// Define user roles
export type UserRole = "admin" | "community";

// Get user role from Clerk metadata
export async function getUserRole(): Promise<UserRole> {
  const user = await currentUser();
  
  if (!user) {
    return "community"; // Default role for non-authenticated
  }
  
  // Check public metadata for role
  const role = user.publicMetadata?.role as UserRole;
  
  // Default to community if no role set
  return role || "community";
}

// Check if user is admin
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin";
}

// Check if user has required role
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  if (requiredRole === "community") {
    return true; // Everyone has community access
  }
  if (requiredRole === "admin") {
    return userRole === "admin";
  }
  return false;
}
