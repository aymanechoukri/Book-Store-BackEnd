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
import Stripe from "stripe";
import order from "../models/order.js";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// Webhook middleware should be before express.json()
app.post("/api/webhook/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata?.userId;

      if (userId) {
        await order.findOneAndUpdate(
          { user: userId },
          { status: "paid" },
          { sort: { createdAt: -1 } }
        );
        console.log("✅ Payment succeeded:", paymentIntent.id);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      console.log("❌ Payment failed:", event.data.object.id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.status(400).json({ error: "Webhook signature verification failed" });
  }
});

// Standard middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use("/uploads", express.static("uploads"));

app.get("/api/dashboard", auth, admin, (req, res) => {
  res.json({ message: "admin 🎉" });
});

// User registration endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = new user({
      name,
      email,
      password,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingAdmin = await user.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const admin = new user({
      name,
      email,
      password,
      role: "admin",
    });

    await admin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error("Create Admin Error:", err.message);
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
    }
    res.json(bookOne);
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
app.post(
  "/api/books",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, price, description, category } = req.body;

      if (!req.files["image"] || !req.files["pdf"]) {
        return res.status(400).json({ message: "Image and PDF are required" });
      }

      const newBook = new book({
        title,
        price,
        description,
        category,
        image: req.files["image"][0].filename,
        pdf: req.files["pdf"][0].filename, // هذا مهم
      });

      await newBook.save();

      res.status(201).json({ message: "Book added successfully", newBook });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  },
);

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

app.post("/api/books/upload", upload.single("pdf"), (req, res) => {
  res.json({ file: req.file.filename });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/verify-token', auth, (req, res) => {
  res.json({ valid: true });
});

app.get('/uploads/:filename', auth, (req, res) => {
  // verify token before sending file
  const filePath = req.params.filename;
  res.download(`./uploads/${filePath}`);
});

// GET user's books (marked/purchased books)
app.get("/api/my-books", auth, async (req, res) => {
  try {
    const userOrders = await order.find({ user: req.user.userId })
      .populate("books.book")
      .sort({ createdAt: -1 });

    const allBooks = userOrders.flatMap(o => o.books.map(b => b.book));

    res.json({
      success: true,
      count: allBooks.length,
      books: allBooks,
    });
  } catch (err) {
    console.error("Get My Books Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// POST create payment intent for Stripe
app.post("/api/create-payment-intent", auth, async (req, res) => {
  try {
    const { books } = req.body; // books = [{bookId, quantity}, ...]

    if (!books || books.length === 0) {
      return res.status(400).json({ message: "No books provided" });
    }

    let totalPrice = 0;
    const bookIds = [];

    for (const item of books) {
      const bookOne = await book.findById(item.bookId);
      if (!bookOne) {
        return res.status(404).json({ message: `Book ${item.bookId} not found` });
      }
      totalPrice += bookOne.price * item.quantity;
      bookIds.push({ book: item.bookId, quantity: item.quantity });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Convert to cents
      currency: "usd",
      metadata: {
        userId: req.user.userId,
        books: JSON.stringify(books),
      },
    });

    // Create order in database
    const newOrder = new order({
      user: req.user.userId,
      books: bookIds,
      totalPrice,
      status: "pending",
    });

    await newOrder.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error("Payment Intent Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default app;
