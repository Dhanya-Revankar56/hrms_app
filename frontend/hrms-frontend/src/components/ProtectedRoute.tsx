// src/components/ProtectedRoute.tsx

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute
 * Checks for a JWT token in localStorage.
 * If absent → redirects to /login (the "/" route).
 * If present → renders children as-is.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
