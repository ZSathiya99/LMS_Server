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

// Create allocation
router.post("/", verifyToken, addAdminAllocation);

// Save subjects with sections
router.post("/subjects", verifyToken, allocateSubjects);

router.get("/dashboard", verifyToken, getHodDashboardData);


router.post("/assign-staff", verifyToken, assignStaffToSection); // create
router.put("/assign-staff/:sectionId", verifyToken, updateStaffForSection); // update by id
router.delete("/assign-staff/:sectionId", verifyToken, deleteStaffFromSection); // remove by id

export default router;
