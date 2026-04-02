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
import order from "../models/order.js";

dotenv.config();
const app = express();

// PayPal Configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_API_BASE = PAYPAL_MODE === "sandbox" 
  ? "https://api-m.sandbox.paypal.com" 
  : "https://api-m.paypal.com";

// Function to get PayPal access token
async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });

    const data = await response.json();
    return data.access_token;
  } catch (err) {
    console.error("❌ PayPal Token Error:", err.message);
    throw err;
  }
}

// PayPal Webhook endpoint
app.post("/api/webhook/paypal", express.json(), async (req, res) => {
  console.log("📨 PayPal Webhook received:", req.body.event_type);
  
  try {
    const event = req.body;
    
    if (event.event_type === "CHECKOUT.ORDER.COMPLETED") {
      const orderId = event.resource?.id;
      const status = event.resource?.status;
      
      if (orderId && status === "COMPLETED") {
        await order.findOneAndUpdate(
          { paypalOrderId: orderId },
          { status: "paid", paypalStatus: status },
          { sort: { createdAt: -1 } }
        );
        console.log("✅ PayPal order completed:", orderId);
      }
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err.message);
    res.status(200).json({ received: true });
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

// 🧪 TEST ENDPOINT - للتشخيص
app.post("/api/test-payment", auth, (req, res) => {
  try {
    console.log("\n=== PAYMENT TEST ===");
    console.log("1️⃣ User authenticated:", req.user);
    console.log("2️⃣ Request body received:", req.body);
    console.log("3️⃣ Books in request:", req.body.books);
    
    const { books } = req.body;

    if (!books) {
      return res.status(400).json({
        success: false,
        message: "❌ books field missing",
        hint: "Send: { books: [{bookId: 'xxx', quantity: 1}] }",
        receivedFields: Object.keys(req.body),
        authStatus: "✅ Authenticated"
      });
    }

    if (!Array.isArray(books)) {
      return res.status(400).json({
        success: false,
        message: "❌ books is not an array",
        received: typeof books,
        authStatus: "✅ Authenticated"
      });
    }

    if (books.length === 0) {
      return res.status(400).json({
        success: false,
        message: "❌ books array is empty",
        authStatus: "✅ Authenticated"
      });
    }

    // Check each book
    const validation = books.map((item, idx) => ({
      index: idx,
      hasBookId: !!item.bookId,
      hasQuantity: !!item.quantity,
      bookId: item.bookId,
      quantity: item.quantity,
      valid: !!item.bookId && !!item.quantity && item.quantity > 0
    }));

    const allValid = validation.every(v => v.valid);

    res.json({
      success: allValid,
      message: allValid ? "✅ All checks passed!" : "❌ Some checks failed",
      authStatus: "✅ Authenticated",
      user: req.user,
      bookCount: books.length,
      validation,
      nextStep: allValid ? "Ready to create payment intent" : "Fix validation errors above"
    });

  } catch (err) {
    console.error("Test error:", err.message);
    res.status(500).json({
      success: false,
      message: "Error in test endpoint",
      error: err.message
    });
  }
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

// POST create PayPal order
app.post("/api/create-paypal-order", auth, async (req, res) => {
  try {
    const { books } = req.body;

    console.log("🔍 PayPal Order Request:", {
      userId: req.user?.userId,
      booksReceived: books,
    });

    // Validation
    if (!books || !Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Books field is required and must be a non-empty array",
      });
    }

    let totalPrice = 0;
    const bookIds = [];
    const items = [];

    // Calculate price and get book details
    for (const item of books) {
      const bookOne = await book.findById(item.bookId);
      if (!bookOne) {
        return res.status(404).json({ 
          success: false,
          message: `Book ${item.bookId} not found` 
        });
      }
      
      const price = parseFloat(bookOne.price);
      if (isNaN(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          message: `Book "${bookOne.title}" has invalid price`,
        });
      }

      totalPrice += price * item.quantity;
      bookIds.push({ book: item.bookId, quantity: item.quantity });
      items.push({
        name: bookOne.title,
        unit_amount: {
          currency_code: "USD",
          value: price.toFixed(2)
        },
        quantity: item.quantity.toString()
      });
    }

    if (totalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Total price must be greater than 0",
      });
    }

    console.log("💳 Creating PayPal order for $" + totalPrice.toFixed(2));

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const paypalResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: totalPrice.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: totalPrice.toFixed(2)
                }
              }
            },
            items: items
          }
        ]
      })
    });

    const paypalOrder = await paypalResponse.json();

    if (!paypalResponse.ok) {
      throw new Error(paypalOrder.message || "Failed to create PayPal order");
    }

    console.log("✅ PayPal order created:", paypalOrder.id);

    // Create order in database
    const newOrder = new order({
      user: req.user.userId,
      books: bookIds,
      totalPrice,
      paypalOrderId: paypalOrder.id,
      status: "pending",
    });

    await newOrder.save();

    console.log("✅ Order saved to database:", newOrder._id);

    res.json({
      success: true,
      paypalOrderId: paypalOrder.id,
      orderId: newOrder._id,
      totalPrice,
      bookCount: books.length
    });
  } catch (err) {
    console.error("❌ PayPal Order Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error creating PayPal order",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST capture PayPal order
app.post("/api/capture-paypal-order", auth, async (req, res) => {
  try {
    const { paypalOrderId } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({
        success: false,
        message: "paypalOrderId is required"
      });
    }

    console.log("📸 Capturing PayPal order:", paypalOrderId);

    const accessToken = await getPayPalAccessToken();

    // Capture payment
    const captureResponse = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      }
    });

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      throw new Error(captureData.message || "Failed to capture payment");
    }

    console.log("✅ Payment captured:", captureData.id);

    // Update order status
    await order.findOneAndUpdate(
      { paypalOrderId },
      { status: "paid", paypalStatus: captureData.status },
      { new: true }
    );

    res.json({
      success: true,
      paypalOrderId: captureData.id,
      status: captureData.status
    });
  } catch (err) {
    console.error("❌ Capture Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error capturing payment",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default app;
