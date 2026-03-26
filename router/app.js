import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcyrpt from "bcrypt";
import user from "../models/user.js";
import book from "../models/book.js";
import jwt from "jsonwebtoken";
import auth from "../middleware/auth.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// User registration endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcyrpt.hash(password, 10);

    const newUser = new user({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
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

    const isMatch = await bcyrpt.compare(password, userOne.password);
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

    res.json({ token });
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
    res.json(books);
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


//Post book
app.post("/api/book", async (req, res) => {
  try {
    const { title, price, discription, category} = req.body;

    const newBook = new book({
      title,
      price,
      discription,
      category
    });
    await newBook.save();
    
    res.status(201).json({ message: "Book added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error"
    });
  }
})

export default app;
