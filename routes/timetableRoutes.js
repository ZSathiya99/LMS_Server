import express from "express";
import {
  saveTimetableSlot,
  getClassTimetable,
  getStaffTimetable,updateTimetableSlot,deleteTimetableSlot
} from "../controllers/timetableController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// hod timetable add/update
router.post("/save", verifyToken, saveTimetableSlot);
//update
router.put("/update", verifyToken, updateTimetableSlot);
//delete
router.delete("/delete", verifyToken, deleteTimetableSlot);

// Class timetable
router.get("/class", verifyToken, getClassTimetable);

// Staff timetable
router.get("/staff", verifyToken, getStaffTimetable);


export default router;
