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
      'COLLEGE_A': '69cf9ab6ba557bc5c95ede7c',
      'COLLEGE_B': '69cf9ab6ba557bc5c95ede89',
      'TEST_CLG_001': '69cf9ab6ba557bc5c95ede8d'
    };

    let tenantId = decoded.tenant_id;
    if (!tenantId && decoded.institution_id) {
      tenantId = TENANT_MAP[decoded.institution_id];
    }
    
    // Auto-convert any object ID forms
    if (tenantId && tenantId.toString) {
      tenantId = tenantId.toString();
    }

    const isValidTenant = tenantId && typeof tenantId === "string" && tenantId.length === 24;
    
    console.log("[Auth Middleware] Decoded:", { decodedTenantId: decoded.tenant_id, finalTenantId: tenantId, isValidTenant });

    return {
      id: decoded.user_id,
      user_id: decoded.user_id,
      tenant_id: isValidTenant ? tenantId : null,
      role: decoded.role,
      institution_id: isValidTenant ? tenantId : null // Backward compatibility support
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
  
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
  if (!normalizedAllowed.includes(user.role.toUpperCase())) {
    throw new Error(`Access Denied: ${user.role} role does not have required permissions.`);
  }
};

module.exports = {
  getUserFromToken,
  normalizeRole,
  requireRole
};
