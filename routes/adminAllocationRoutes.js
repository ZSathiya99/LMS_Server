import express from "express";
import {
  allocateSubjects,
  getHodDashboardData,
  assignStaffToSection,
  updateStaffForSection,
  deleteStaffFromSection,deleteSection,getAllocatedSubjects
} from "../controllers/adminAllocationController.js";

import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------------------------------------------
   SUBJECT ALLOCATION
--------------------------------------------------- */

// Allocate subjects for a semester
router.post("/allocate-subjects", verifyToken, allocateSubjects);

// GET
router.get("/subjects",verifyToken, getAllocatedSubjects);

// HOD dashboard (fetch subjects + staff)
router.get("/hod-dashboard", verifyToken, getHodDashboardData);

/* ---------------------------------------------------
   STAFF ASSIGNMENT
--------------------------------------------------- */

// Assign staff to a section
router.post("/admin-allocation", verifyToken, assignStaffToSection);


router.patch("/update-staff/:sectionId", verifyToken, updateStaffForSection);
router.delete("/delete-staff/:sectionId", verifyToken, deleteStaffFromSection);
router.delete("/delete-section/:sectionId", verifyToken, deleteSection);

export default router;
