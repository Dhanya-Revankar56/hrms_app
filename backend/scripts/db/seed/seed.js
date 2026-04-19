require("dotenv").config();
const mongoose = require("mongoose");
const Employee = require("../src/modules/employee/model");

const dummyEmployees = [
  {
    institution_id: "COLLEGE_A",
    first_name: "Rahul",
    last_name: "Sharma",
    user_email: "rahul.a@college-a.edu",
    user_contact: "9876543210",
    app_role: "Staff",
    work_detail: {
      designation: "Assistant Professor",
      department: "Computer Science",
    },
  },
  {
    institution_id: "COLLEGE_A",
    first_name: "Priya",
    last_name: "Patil",
    user_email: "priya.p@college-a.edu",
    user_contact: "9876543211",
    app_role: "Admin",
    work_detail: {
      designation: "HOD",
      department: "Mathematics",
    },
  },
  {
    institution_id: "COLLEGE_B",
    first_name: "Amit",
    last_name: "Kumar",
    user_email: "amit.k@college-b.ac.in",
    user_contact: "8888888888",
    app_role: "Staff",
    work_detail: {
      designation: "Lecturer",
      department: "Physics",
    },
  },
];

async function seedData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, { family: 4 });
    console.log("Connected! Cleaning old employee data for these colleges...");

    // Optional: Clear existing data for these test colleges to avoid duplicates
    await Employee.deleteMany({
      institution_id: { $in: ["COLLEGE_A", "COLLEGE_B"] },
    });

    console.log("Inserting dummy employees one by one (to trigger hooks)...");
    for (const data of dummyEmployees) {
      const emp = new Employee(data);
      await emp.save();
      console.log(
        `Created: ${emp.first_name} ${emp.last_name} (${emp.employee_id})`,
      );
    }

    console.log("✅ Seeded 3 dummy employees successfully!");
    console.log("- 2 for COLLEGE_A");
    console.log("- 1 for COLLEGE_B");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    process.exit(1);
  }
}

seedData();
