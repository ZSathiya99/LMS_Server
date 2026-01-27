import express from "express";
import {
  saveTimetableSlot,
  getClassTimetable,
  getStaffTimetable,
} from "../controllers/timetableController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin timetable add/update
router.post("/save", verifyToken, saveTimetableSlot);

// Class timetable
router.get("/class", verifyToken, getClassTimetable);

// Staff timetable
router.get("/staff", verifyToken, getStaffTimetable);

export default router;
