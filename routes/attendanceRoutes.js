import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  markAttendance,
  getAttendanceStudents,getAttendanceByDate,markBulkAttendance,getAttendancePrint,downloadAttendanceExcel
} from "../controllers/attendanceController.js";

const router = express.Router();

router.post("/attendance/mark", verifyToken, markAttendance);
router.get("/attendance/students", verifyToken, getAttendanceStudents);
router.get("/attendance/date", verifyToken, getAttendanceByDate);
router.post("/attendance/bulk", verifyToken, markBulkAttendance);
router.get("/attendance/print",verifyToken, getAttendancePrint);
router.get("/attendance/download-excel",verifyToken, downloadAttendanceExcel);




export default router;
