// src/utils/auth.ts
// Central auth utilities — single source of truth for role checks across the app

export type AppRole = "ADMIN" | "HOD" | "EMPLOYEE";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string; // raw from DB: "admin" | "hod" | "employee"
  institution_id: string;
}

/**
 * Normalize raw DB role to uppercase enum.
 * DB stores: "admin" | "hod" | "employee"
 * Backend JWT normalizes to: "ADMIN" | "HEAD OF DEPARTMENT" | "EMPLOYEE"
 * We use a simpler 3-value enum on the frontend: ADMIN | HOD | EMPLOYEE
 */
export function normalizeRole(raw: string | undefined | null): AppRole {
  if (!raw) return "EMPLOYEE";
  const upper = raw.toUpperCase();
  if (upper === "ADMIN") return "ADMIN";
  if (upper === "HOD" || upper === "HEAD OF DEPARTMENT") return "HOD";
  return "EMPLOYEE";
}

/** Get the current logged-in user from localStorage. Returns null if not logged in. */
export function getCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

/** Get the normalized role of the current user. */
export function getRole(): AppRole {
  const user = getCurrentUser();
  return normalizeRole(user?.role);
}

export function isAdmin(): boolean {
  return getRole() === "ADMIN";
}

export function isHod(): boolean {
  return getRole() === "HOD";
}

export function isEmployee(): boolean {
  return getRole() === "EMPLOYEE";
}

/** Check if the current user has one of the given roles. */
export function hasRole(...roles: AppRole[]): boolean {
  return roles.includes(getRole());
}
