import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import adminAllocationRoutes from "./routes/adminAllocationRoutes.js";

dotenv.config();

// ✅ Connect MongoDB
connectDB();

const app = express();

// ✅ CORS setup
app.use(cors({
  origin: [
    "http://localhost:5173",             // your local frontend
    "https://your-frontend-domain.com",  // replace with your Render frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));

// ✅ Handle preflight requests safely (Express v5 compatible)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ Parse JSON
app.use(express.json());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/subjects", subjectRoutes);

app.use("/api/adminAllocation", adminAllocationRoutes);

// ✅ Default route
app.get("/", (req, res) => {
  res.send("LMS Backend is running ✅");
});

export default app;
