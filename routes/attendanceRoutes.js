import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  markAttendance,
  getAttendanceStudents,getAttendanceByDate,markBulkAttendance,getAttendancePrint
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/attendance/mark", verifyToken, markAttendance);
router.get("/attendance/students", verifyToken, getAttendanceStudents);
router.get("/attendance/date", verifyToken, getAttendanceByDate);
router.post("/attendance/bulk", verifyToken, markBulkAttendance);
router.get("/attendance/print",verifyToken, getAttendancePrint);




export default router;
