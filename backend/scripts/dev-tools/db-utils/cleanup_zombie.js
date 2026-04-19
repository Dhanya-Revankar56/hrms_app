const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const User = require("../src/modules/auth/user.model");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB!");

  const users = await User.find({ email: "adfr@gmail.com" });
  for (const u of users) {
    const emp = await mongoose.connection
      .collection("employees")
      .findOne({ user_id: u._id });
    if (!emp) {
      console.log("Deleting zombie auth record:", u.email);
      await User.deleteOne({ _id: u._id });
    }
  }
  console.log("Done");
  process.exit(0);
}
run();
