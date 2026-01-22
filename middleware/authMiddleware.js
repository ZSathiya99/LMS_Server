import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided or invalid format" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decode akka",decoded)

    req.user = decoded;

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

