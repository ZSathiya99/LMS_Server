import express from "express";
import {
  addFaculty,
  uploadMultipleFaculty,
  getAllFaculty,
  getDepartmentWise,
  getDashboardStats,
  getDepartmentWiseFaculty,
} from "../controllers/facultyController.js";
import { upload } from "../middleware/upload.js"; // ✅ use this only

const router = express.Router();

// ✅ Routes
router.post("/add", addFaculty); // Add single faculty
router.post("/upload", upload.single("file"), uploadMultipleFaculty);
router.get("/", getAllFaculty); // Get all faculty
router.get("/department-wise", getDepartmentWise); // Department-wise count
router.get("/stats", getDashboardStats); // Dashboard summary
router.get("/department-wise/:department", getDepartmentWiseFaculty);


export default router;
