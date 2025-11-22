import express from "express";
import {
  allocateSubjects,
  getHodDashboardData,
  assignStaffToSection,
  updateStaffForSection,
  deleteStaffFromSection
} from "../controllers/adminAllocationController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------------------------------------------
   SUBJECT ALLOCATION
--------------------------------------------------- */

// Allocate subjects for a semester
router.post("/allocate-subjects", verifyToken, allocateSubjects);

// HOD dashboard (fetch subjects + staff)
router.get("/hod-dashboard", verifyToken, getHodDashboardData);

/* ---------------------------------------------------
   STAFF ASSIGNMENT
--------------------------------------------------- */

// Assign staff to a section
router.post("/assign-staff", verifyToken, assignStaffToSection);

// Update assigned staff
router.put("/assign-staff/:sectionId", verifyToken, updateStaffForSection);

// Delete staff from a section
router.delete("/assign-staff/:sectionId", verifyToken, deleteStaffFromSection);

export default router;
