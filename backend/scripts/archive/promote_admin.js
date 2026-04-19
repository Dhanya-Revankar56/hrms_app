require("dotenv").config({ path: "backend/.env" });
const { MongoClient } = require("mongodb");

async function run() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db();
    const result = await db
      .collection("users")
      .updateOne(
        { email: "dhanyavernekar@gmail.com" },
        { $set: { role: "ADMIN" } },
      );
    console.log("✅ Admin Promotion Result:", result);

    // Also check the user document now
    const user = await db
      .collection("users")
      .findOne({ email: "dhanyavernekar@gmail.com" });
    console.log("👤 Current User state:", {
      email: user.email,
      role: user.role,
    });
  } finally {
    await client.close();
  }
}
run();
