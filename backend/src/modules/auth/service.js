const jwt = require("jsonwebtoken");
const User = require("./user.model");
const Tenant = require("../tenant/model");
const AuditLog = require("../audit/model");

/**
 * Enterprise Login Service with Rate Limiting and Strict Scoping
 */
exports.login = async (email, password, reqMetadata = {}) => {
  console.log("🔍 Universal Login Attempt:", { email });

  // 1. Find User Globally (Ignore Tenant Filter)
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+password")
    .setOptions({ skipTenant: true })
    .populate("tenant_id"); // Resolve full tenant info
  
  console.log("👤 User Lookup Result:", user ? { id: user._id, role: user.role, tenant_id: user.tenant_id?._id || user.tenant_id } : "USER_NOT_FOUND");
  
  if (!user) {
    throw new Error(`Invalid Credentials: Your account was not found. Please contact support.`);
  }

  // 2. Resolve Tenant
  const tenant = user.tenant_id;
  if (!tenant || !tenant.isActive) {
    throw new Error(`Institution Access Error: The institution associated with this account is inactive.`);
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
