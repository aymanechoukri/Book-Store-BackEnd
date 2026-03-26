import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  // Case-insensitive header lookup
  const headers = req.headers;
  const authHeader = (headers.authorization || headers.Authorization || '').toString().trim();
  
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({ message: "Invalid token format. Use 'Bearer <token>'" });
  }

  try {
    const secret = process.env.JWT_SECRET || "fallback_secret_for_testing";
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    console.log("✅ Auth success:", decoded);
    console.log("Auth Header:", authHeader);
    next();
  } catch (err) {
    console.error("❌ JWT Error:", err.name, err.message);
    res.status(401).json({ 
      message: "Invalid token", 
      error: err.name === "TokenExpiredError" ? "Token expired" : "Invalid token format or signature"
    });
  }
};

export default auth;
