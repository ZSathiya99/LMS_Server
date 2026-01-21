import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  markPresent,
  markAbsent,
  markOnDuty,getAttendanceOverview,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.get("/staff/attendance/overview", verifyToken, getAttendanceOverview);
router.post("/staff/attendance/present", verifyToken, markPresent);
router.post("/staff/attendance/absent", verifyToken, markAbsent);
router.post("/staff/attendance/onduty", verifyToken, markOnDuty);


export default router;
