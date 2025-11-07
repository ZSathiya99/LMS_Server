import express from "express";
import {
  addFaculty,
  updateFaculty,
  deleteFaculty,
  uploadMultipleFaculty,
  getAllFaculty,
  getDepartmentWise,
  getDashboardStats,
  getDepartmentWiseFaculty,
} from "../controllers/facultyController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadExcel, uploadDocuments } from "../middleware/upload.js";

const router = express.Router();

/* ------------------------- PUBLIC OR OPEN ROUTES ------------------------- */

// ➕ Add a single faculty (with PDFs/images)
router.post(
  "/add-faculty",
  uploadDocuments.fields([
    { name: "markSheet", maxCount: 1 },
    { name: "experienceCertificate", maxCount: 1 },
    { name: "degreeCertificate", maxCount: 1 },
  ]),
  addFaculty
);

// ✏️ Update a faculty
router.put(
  "/faculty/:id",
  uploadDocuments.fields([
    { name: "markSheet", maxCount: 1 },
    { name: "experienceCertificate", maxCount: 1 },
    { name: "degreeCertificate", maxCount: 1 },
  ]),
  updateFaculty
);

// ❌ Delete a faculty
router.delete("/faculty/:id", deleteFaculty);

/* ---------------------- PROTECTED ROUTES (Token needed) ---------------------- */
router.use(verifyToken);

// 📤 Upload Excel for multiple faculty
router.post("/upload", uploadExcel.single("file"), uploadMultipleFaculty);

// 📋 Get all faculty
router.get("/", getAllFaculty);

// 📊 Get department-wise count
router.get("/department-wise", getDepartmentWise);

// 🧮 Get dashboard stats
router.get("/stats", getDashboardStats);

// 🧑‍🏫 Get faculty by department
router.get("/department-wise/:department", getDepartmentWiseFaculty);

export default router;
