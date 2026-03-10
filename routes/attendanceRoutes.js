import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

import {
  markAttendance,
  getAttendanceStudents,
  getAttendanceByDate,
  markBulkAttendance,
  getAttendancePrint,
  downloadAttendanceExcel,
  getAttendanceBySubjectAndDate,

  // ⭐ NEW APIs
  raiseAttendanceEditRequest,
  getAttendanceRequestSlots,
  approveAttendanceEdit,
  rejectAttendanceEdit,getSlotAttendanceRequests,submitAttendanceRequests,getAttendanceRequestHistory
} from "../controllers/attendanceController.js";

const router = express.Router();

/* =========================================================
   ATTENDANCE
========================================================= */

router.post("/attendance/mark", verifyToken, markAttendance);
router.post("/attendance/bulk", verifyToken, markBulkAttendance);

router.get("/attendance/students", verifyToken, getAttendanceStudents);
router.get("/attendance/date", verifyToken, getAttendanceByDate);
router.get("/attendance/subject-date", verifyToken, getAttendanceBySubjectAndDate);

router.get("/attendance/print", verifyToken, getAttendancePrint);
router.get("/attendance/download-excel", verifyToken, downloadAttendanceExcel);


/* =========================================================
   ATTENDANCE EDIT REQUEST SYSTEM
========================================================= */


// Staff → Raise edit request
router.post(
  "/attendance/edit-request",
  verifyToken,
  raiseAttendanceEditRequest
);
console.log("into routes");


// HOD → View requests-slots
router.get(
  "/attendance/request-slots",
  verifyToken,
  getAttendanceRequestSlots
);

router.get(
  "/attendance/request-slot-details",
  verifyToken,
  getSlotAttendanceRequests
);

// HOD → Approve request
router.put(
  "/attendance/edit-request/:requestId/approve",
  verifyToken,
  approveAttendanceEdit
);

// HOD → Reject request
router.put(
  "/attendance/edit-request/:requestId/reject",
  verifyToken,
  rejectAttendanceEdit
);

router.post(
  "/attendance/requests/submit",
  verifyToken,
  submitAttendanceRequests
);
router.get(
  "/attendance/request-history",
  verifyToken,
  getAttendanceRequestHistory
);

export default router;