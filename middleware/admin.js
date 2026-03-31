const admin = (req, res, next) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

export default admin;