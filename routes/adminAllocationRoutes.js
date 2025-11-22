import express from "express";
import {
  addAdminAllocation,
  allocateSubjects,
  getHodDashboardData,
  assignStaffToSection,
  updateStaffForSection,
  deleteStaffFromSection,
} from "../controllers/adminAllocationController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------------------------------------------
   SUBJECT ALLOCATION
--------------------------------------------------- */

// Create base allocation (optional)
router.post("/", verifyToken, addAdminAllocation);

// Allocate subjects
router.post("/allocate-subjects", verifyToken, allocateSubjects);

// Get HOD dashboard
router.get("/hod-dashboard", verifyToken, getHodDashboardData);

/* ---------------------------------------------------
   STAFF ASSIGNMENT
--------------------------------------------------- */

// Assign staff to section
router.post("/assign-staff", verifyToken, assignStaffToSection);

// Update staff in section
router.put("/assign-staff/:sectionId", verifyToken, updateStaffForSection);

// Delete staff from section
router.delete("/assign-staff/:sectionId", verifyToken, deleteStaffFromSection);

export default router;
