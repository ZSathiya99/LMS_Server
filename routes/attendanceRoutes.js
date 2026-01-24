import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  markAttendance,
  getAttendanceStudents
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/attendance/mark", verifyToken, markAttendance);
router.get("/attendance/students", verifyToken, getAttendanceStudents);

export default router;
