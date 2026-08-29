const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const Admin = require("./models/Admin");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const existingAdmin = await Admin.findOne({
      email: "admin@example.com",
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("Nilesh@0020", 10);

    const admin = await Admin.create({
      name: "Admin",
      email: "nileshmaurya2004@gmail.com",
      password: hashedPassword,
    });

    console.log("Admin created successfully");
    console.log("Email:", admin.email);

    process.exit();
  } catch (error) {
    console.log("Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();