const { MongoClient } = require("mongodb");
async function run() {
  const client = new MongoClient(
    "mongodb+srv://dhanyavernekar_db_user:Dhanya2026@cluster0.t9urwje.mongodb.net/hrms",
  );
  try {
    await client.connect();
    const db = client.db("hrms");
    const col = db.collection("settings");

    // Update College ALPHA
    await col.updateOne(
      { tenant_id: "69cf9ab6ba557bc5c95ede7c" },
      {
        $set: {
          institution_name: "College ALPHA",
          institution_id: "ALPHA_001",
        },
      },
      { upsert: true },
    );

    // Update College BETA
    await col.updateOne(
      { tenant_id: "69cf9ab6ba557bc5c95ede89" },
      {
        $set: {
          institution_name: "College BETA",
          institution_id: "BETA_001",
        },
      },
      { upsert: true },
    );

    console.log(
      "Successfully updated ALPHA and BETA labels with unique institution IDs.",
    );
  } finally {
    await client.close();
  }
}
run().catch(console.error);
