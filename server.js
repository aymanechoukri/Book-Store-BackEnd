import app from "./router/app.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

connectDB();
dotenv.config();

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
