import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import adminAllocationRoutes from "./routes/adminAllocationRoutes.js";

dotenv.config();

// Connect DB
connectDB();

const app = express();

// CORS
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/subjects", subjectRoutes);

// ⭐ ONLY THIS ONE LINE FOR ALLOCATION ⭐
app.use("/api/admin-allocation", adminAllocationRoutes);

// HOME
app.get("/", (req, res) => {
  res.send("LMS Backend is running ✅");
});

export default app;
