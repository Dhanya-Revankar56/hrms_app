// src/components/ProtectedRoute.tsx

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getRole, type AppRole } from "../utils/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If provided, only users with one of these roles can access this route.
   *  Others are redirected to /dashboard (they're authenticated, just not authorized). */
  allowedRoles?: AppRole[];
}

/**
 * ProtectedRoute
 * – No token → redirect to / (login)
 * – Token exists but wrong role → redirect to /dashboard
 * – Token + correct role → render children
 */
export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = getRole();
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
