const jwt = require("jsonwebtoken");
const Employee = require("../employee/model");

exports.login = async (email, password) => {
  // 1. Find user by email (include password)
  const user = await Employee.findOne({ user_email: email }).select("+password");
  
  if (!user || !user.password) {
    throw new Error("Invalid credentials or account not set up for login");
  }

  // 2. Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // 3. Generate JWT
  const token = jwt.sign(
    { 
      userId: user._id, 
      role: user.app_role, 
      institution_id: user.institution_id 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || "24h" }
  );

  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.user_email,
      name: `${user.first_name} ${user.last_name}`,
      role: user.app_role,
      institution_id: user.institution_id
    }
  };
};
