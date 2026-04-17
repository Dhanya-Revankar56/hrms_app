const mongoose = require("mongoose");
const dns = require("dns");

// Only force reliable DNS in local development to fix ECONNREFUSED issues with SRV records
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
}

// Force IPv4 DNS resolution — fixes ECONNREFUSED on Windows with MongoDB Atlas SRV
dns.setDefaultResultOrder("ipv4first");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error(
      "⚠️  Server will keep running — check your MONGO_URI in .env",
    );
  }
};

module.exports = connectDB;
