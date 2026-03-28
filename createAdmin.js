import mongoose from "mongoose";
import dotenv from "dotenv";
import user from "./models/user.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)  // ما كاينش حاجة إضافية
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

async function createAdmin() {
  try {
    const existingAdmin = await user.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const admin = new user({
      name: "Admin",
      email: "admin@gmail.com",
      password: "123456789", // راجع pre-save hashing في موديل User
      role: "admin",
    });

    await admin.save();
    console.log("Admin created successfully");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();