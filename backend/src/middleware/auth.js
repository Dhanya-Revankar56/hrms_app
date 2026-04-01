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
 */
const getUserFromToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      id: decoded.userId,
      role: normalizeRole(decoded.role),
      rawRole: decoded.role,
      institution_id: decoded.institution_id
    };
  } catch (err) {
    return null;
  }
};

/**
 * Helper to enforce roles within resolvers
 */
const requireRole = (user, allowedRoles) => {
  if (!user) throw new Error("Authentication required");
  
  // Normalize allowed roles for comparison
  const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
  if (!normalizedAllowed.includes(user.role)) {
    throw new Error("You do not have permission to perform this action");
  }
};

module.exports = {
  getUserFromToken,
  normalizeRole,
  requireRole
};
