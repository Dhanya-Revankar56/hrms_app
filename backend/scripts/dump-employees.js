const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const EmployeeSchema = new mongoose.Schema({
  name: String,
  tenant_id: mongoose.Schema.Types.ObjectId,
  institution_id: String
}, { collection: 'employees' });

const Employee = mongoose.model('Employee', EmployeeSchema);

async function dump() {
  await mongoose.connect(process.env.MONGO_URI);
  const all = await Employee.find({}).lean();
  console.log("Total Count:", all.length);
  all.forEach(e => {
    console.log(`- Name: ${e.name} | TenantID: ${e.tenant_id} | InstID: ${e.institution_id}`);
  });
  process.exit();
}

dump().catch(e => { console.error(e); process.exit(1); });
