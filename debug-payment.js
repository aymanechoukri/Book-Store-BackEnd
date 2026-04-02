import connectDB from "./config/db.js";
import book from "./models/book.js";
import dotenv from "dotenv";

dotenv.config();

async function debugPayment() {
  try {
    console.log("🔍 Starting payment debug...\n");
    
    // Connect to database
    await connectDB();
    
    // Get all books
    const books = await book.find();
    console.log(`📚 Total books in DB: ${books.length}\n`);
    
    if (books.length === 0) {
      console.log("❌ ERROR: No books found in database!");
      process.exit(1);
    }
    
    // Show first 5 books
    books.slice(0, 5).forEach((b, i) => {
      console.log(`${i + 1}. Title: ${b.title}`);
      console.log(`   Price: $${b.price} (Type: ${typeof b.price})\n`);
    });
    
    // Simulate a payment calculation
    console.log("💳 Simulating payment calculation:\n");
    const testItems = [
      { bookId: books[0]._id, quantity: 1 }
    ];
    
    if (books.length > 1) {
      testItems.push({ bookId: books[1]._id, quantity: 2 });
    }
    
    let totalPrice = 0;
    for (const item of testItems) {
      const b = await book.findById(item.bookId);
      const price = parseFloat(b.price);
      const lineTotal = price * item.quantity;
      console.log(`${b.title} × ${item.quantity} = $${lineTotal.toFixed(2)}`);
      totalPrice += lineTotal;
    }
    
    console.log(`\n📊 Final Calculation:`);
    console.log(`   Total Amount: $${totalPrice.toFixed(2)}`);
    console.log(`   Amount in Cents: ${Math.round(totalPrice * 100)}`);
    
    if (totalPrice <= 0) {
      console.log("\n❌ ERROR: Total price is 0 or negative!");
    } else {
      console.log("\n✅ Amount is valid for Stripe!");
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

debugPayment();
