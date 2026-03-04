import express from "express";

import {
//   getFacultyAttendance,
  getFacultySubjects,
  getFacultyTimetable
} from "../controllers/adminFacultyController.js";

const router = express.Router();


/* ===============================
   Faculty Attendance
=============================== */

// router.get(
//   "/faculty/:facultyId/attendance",
//   getFacultyAttendance
// );


/* ===============================
   Faculty Subject List
=============================== */

router.get(
  "/faculty/:facultyId/subjects",
  getFacultySubjects
);


/* ===============================
   Faculty Timetable
=============================== */

router.get(
  "/faculty/:facultyId/timetable",
  getFacultyTimetable
);


export default router;