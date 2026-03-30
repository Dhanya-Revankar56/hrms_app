const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function findRelievedToday() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const relievingSchema = new mongoose.Schema({
      employee_id: mongoose.Schema.Types.ObjectId,
      status: String,
      updated_at: Date,
      reason: String
    }, { collection: 'relievings' });

    const Relieving = mongoose.model('Relieving', relievingSchema);
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const relieved = await Relieving.find({ 
      status: "Relieved",
      updated_at: { $gte: today }
    }).populate('employee_id');

    console.log(`Found ${relieved.length} employees relieved today.`);
    relieved.forEach(r => {
      console.log(`Employee ID: ${r.employee_id}, Status: ${r.status}, Reason: ${r.reason}, Updated: ${r.updated_at}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

findRelievedToday();
