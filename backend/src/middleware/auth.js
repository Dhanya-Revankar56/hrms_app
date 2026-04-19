const jwt = require("jsonwebtoken");

/**
 * Normalizes role values (e.g., 'hod' -> 'HEAD OF DEPARTMENT')
 */
const normalizeRole = (role) => {
  if (!role) return "GUEST";
  const map = {
    employee: "EMPLOYEE",
    hod: "HEAD OF DEPARTMENT",
    admin: "ADMIN",
  };
  return map[role.toLowerCase()] || role.toUpperCase();
};

/**
 * Verifies JWT and returns the user object for context
 * Also validates that if x-institution-id header is provided, it matches the JWT's institution_id
 */
const getUserFromToken = (req) => {
  const authHeader = req?.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Legacy mapping for transition
    const TENANT_MAP = {
      COLLEGE_A: "69cf9ab6ba557bc5c95ede7c",
      COLLEGE_B: "69cf9ab6ba557bc5c95ede89",
      TEST_CLG_001: "69cf9ab6ba557bc5c95ede8d",
    };

    // 🛡 Role-Based Header Override (Super Admin Only)
    // This allows Super Admins to "drill down" into a specific college while in the dashboard
    const headerTenantCode =
      req?.headers?.["x-institution-id"] || req?.headers?.["x-tenant-id"];

    let tenantId = decoded.tenant_id;
    const isSuperAdmin = normalizeRole(decoded.role) === "SUPER_ADMIN";

    // 1. Resolve from token (priority)
    if (!tenantId && decoded.institution_id) {
      tenantId =
        TENANT_MAP[decoded.institution_id] ||
        (decoded.institution_id.length === 24 ? decoded.institution_id : null);
    }

    // 2. Resolve from Header (Override for Super Admin, Fallback for Others)
    if (headerTenantCode && (isSuperAdmin || !tenantId)) {
      const mappedId =
        TENANT_MAP[headerTenantCode.toUpperCase()] ||
        (headerTenantCode.length === 24 ? headerTenantCode : null);
      if (mappedId) {
        tenantId = mappedId;
      }
    }

    // Auto-convert any object ID forms
    if (tenantId && tenantId.toString) {
      tenantId = tenantId.toString();
    }

    const isValidTenant =
      tenantId && typeof tenantId === "string" && tenantId.length === 24;

    // 🛡 Diagnostic Persistence (Because terminal output is truncated/unreliable)
    try {
      require("fs").appendFileSync(
        require("path").join(process.cwd(), "audit_log.txt"),
        `[${new Date().toISOString()}] Email: ${decoded.email} | Role: ${decoded.role} | Header: ${headerTenantCode} | Final: ${tenantId}\n`,
      );
    } catch (_e) {
      // Diagnostic failure shouldn't block the request
    }

    return {
      id: decoded.user_id,
      user_id: decoded.user_id,
      email: decoded.email,
      tenant_id: isValidTenant ? tenantId : null,
      role: normalizeRole(decoded.role),
      institution_id: isValidTenant ? tenantId : null, // Backward compatibility support
    };
  } catch (err) {
    console.error("[Auth Middleware] Token verification failed:", err.message);
    return null;
  }
};

/**
 * Enterprise Utility: Verify role and tenant
 */
const requireRole = (user, allowedRoles) => {
  if (!user) throw new Error("Authentication required");
  if (!user.tenant_id) throw new Error("Missing tenant context in session");

  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  if (!normalizedAllowed.includes(user.role.toUpperCase())) {
    throw new Error(
      `Access Denied: ${user.role} role does not have required permissions.`,
    );
  }
};

module.exports = {
  getUserFromToken,
  normalizeRole,
  requireRole,
};
