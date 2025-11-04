import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";

dotenv.config();
connectDB();

const app = express();
// app.use(cors());
app.use(cors({
  origin: ["http://localhost:5173", "https://your-frontend-domain.com"], // allow both local + deployed frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // if using cookies or auth headers
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);


export default app;
