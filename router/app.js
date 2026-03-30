import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import user from "../models/user.js";
import book from "../models/book.js";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import multer from "multer";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

app.get("/api/dashboard", auth, admin, (req, res) => {
  res.json({ message: "admin 🎉" });
});

// User registration endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = new user({
      name,
      email,
      password,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await user.findOne({ email });
    if (existingAdmin)
      return res.status(400).json({ message: "Admin already exists" });

    const admin = new user({
      name,
      email,
      password,
      role: "admin",
    });

    await admin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// User login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const userOne = await user.findOne({ email });
    if (!userOne) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, userOne.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        userId: userOne._id,
        role: userOne.role,
      },
      process.env.JWT_SECRET || "fallback_secret_for_testing",
      { expiresIn: "1h" },
    );

    res.json({ role: userOne.role, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await user.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("Get Users Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

//DELETE user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await user.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/protected", auth, (req, res) => {
  res.json({
    message: "You are authorized 🎉",
    user: req.user,
  });
});

// Get all books
app.get("/api/books", async (req, res) => {
  try {
    const books = await book.find();
    res.json({ books });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get book by ID
app.get("/api/book/:id", async (req, res) => {
  try {
    const bookOne = await book.findById(req.params.id);
    if (!bookOne) {
      return res.status(404).json({ message: "Book not found" });
      res.json(bookOne);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

//Post book
app.post("/api/books", upload.single("image"), async (req, res) => {
  try {
    const { title, price, description, category } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const newBook = new book({
      title,
      price,
      description,
      category,
      image: req.file.filename,
    });

    await newBook.save();

    res.status(201).json({ message: "Book added successfully", newBook });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE book
app.delete("/api/books/:id", async (req, res) => {
  try {
    await book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default app;

