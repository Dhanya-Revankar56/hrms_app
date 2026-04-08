const jwt = require("jsonwebtoken");
const User = require("./user.model");
const Tenant = require("../tenant/model");
const AuditLog = require("../audit/model");

/**
 * Enterprise Login Service with Rate Limiting and Strict Scoping
 */
exports.login = async (email, password, tenant_code, reqMetadata = {}) => {
  console.log("🔍 Login Attempt:", { email, tenant_code });

  // 1. Resolve Tenant
  if (!tenant_code) throw new Error("Institution/Campus code is required for login.");
  
  const tenant = await Tenant.findOne({ code: tenant_code.toUpperCase(), isActive: true }).setOptions({ skipTenant: true });
  console.log("🏙 Resolved Tenant:", tenant ? { id: tenant._id, code: tenant.code } : "NOT_FOUND");

  if (!tenant) throw new Error(`Invalid Institution: '${tenant_code}' is not a registered campus.`);

  // 2. Find User within Tenant Scope
  const user = await User.findOne({ 
    email: email.toLowerCase(), 
    tenant_code: tenant_code.toUpperCase() 
  }).select("+password").setOptions({ skipTenant: true });
  
  console.log("👤 User Lookup Result:", user ? { id: user._id, role: user.role, tenant_code: user.tenant_code } : "USER_NOT_FOUND_IN_TENANT");

  if (!user) {
    throw new Error(`Invalid Credentials: User not found in ${tenant.name}. Please check your campus selection.`);
  }

  // 🛡 3. Brute-Force Check
  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new Error("Account is temporarily locked due to repeated failures. Try again later.");
  }

  // 4. Validate Credentials
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    // Increment attempts
    user.loginAttempts += 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
    }
    await user.save();
    
    throw new Error("Invalid credentials.");
  }

  // 5. Reset attempts on success
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  // 6. Generate Secured JWT
  const token = jwt.sign(
    { 
      user_id: user._id, 
      tenant_id: tenant._id, 
      tenant_code: tenant.code,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || "24h" }
  );

  // 7. Audit Log
  await AuditLog.create({
    action: "USER_LOGIN",
    user_id: user._id,
    tenant_id: tenant._id,
    metadata: {
      email,
      ip: reqMetadata?.ip || "unknown",
      userAgent: reqMetadata?.userAgent || "unknown"
    }
  });

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      tenant_id: tenant._id.toString(),
      tenant_code: tenant.code
    }
  };
};
