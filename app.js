import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import adminAllocationRoutes from "./routes/adminAllocationRoutes.js";
import studentRoutes from "./routes/studentRoutes.js"; 
import staffRoutes from "./routes/staffRoutes.js"; 
import subjectPlanningRoutes from "./routes/subjectPlanningRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import hodRoutes from "./routes/hodRoutes.js";



dotenv.config();

// Connect DB
connectDB();

const app = express();

// CORS
app.use(cors({
  origin: ["http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
}));

app.use(express.json());

// ROUTES ✅
app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/admin-allocation", adminAllocationRoutes);
app.use("/api/students", studentRoutes);
app.use("/api", staffRoutes);
app.use("/api", subjectPlanningRoutes);
app.use("/api", attendanceRoutes); // ✅ attendance here
app.use("/api", hodRoutes);

// HOME
app.get("/", (req, res) => {
  res.send("LMS Backend is running ✅");
});

export default app;
