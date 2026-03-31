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
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set. Cannot start server.");
    }
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'] // Only allow HS256
    });
    req.user = decoded;
    console.log("✅ Auth success:", decoded);
    console.log("Auth Header:", authHeader);
    next();
  } catch (err) {
    console.error("❌ JWT Error:", err.name, err.message);
    if (process.env.NODE_ENV === 'production') {
      res.status(401).json({ message: "Invalid or expired token" });
    } else {
      res.status(401).json({ 
        message: "Invalid token",
        error: err.name
      });
    }
  }
};

export default auth;
