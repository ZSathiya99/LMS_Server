import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // ✅ 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ 3. Attach decoded user info to request
    req.user = decoded;

    // ✅ 4. Continue to the next middleware or route
    next();
  } catch (error) {
    console.error("❌ Token validation error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
// export const verifyHOD = (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) return res.status(401).json({ message: "No token provided" });

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     if (decoded.role !== "HOD") {
//       return res.status(403).json({ message: "Access denied. HOD only." });
//     }

//     req.user = decoded;
//     next();

//   } catch (error) {
//     res.status(401).json({ message: "Invalid token" });
//   }
// };

