const mongoose = require("mongoose");
mongoose
  .connect(
    "mongodb+srv://dhanyavernekar_db_user:Dhanya2026@cluster0.t9urwje.mongodb.net/hrms",
  )
  .then(async () => {
    const db = mongoose.connection.db;
    const logs = await db
      .collection("auditlogs")
      .find({ "metadata.employee_id": { $exists: true } })
      .sort({ _id: -1 })
      .limit(2)
      .toArray();
    console.log(JSON.stringify(logs, null, 2));
    process.exit(0);
  });
