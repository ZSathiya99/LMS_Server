import express from "express";
import {
  addFaculty,
  updateFaculty,
  deleteFaculty,
  uploadMultipleFaculty,
  getAllFaculty,
  getDepartmentWise,
  getDashboardStats,
  getDepartmentWiseFaculty,getDepartmentWiseFacultyList
} from "../controllers/facultyController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadExcel, uploadDocuments } from "../middleware/upload.js";

const router = express.Router();

/* ============================= PUBLIC ROUTES ============================= */

// ➕ Add a single faculty (with file upload)
router.post(
  "/add-faculty",
  uploadDocuments.fields([
    { name: "markSheet", maxCount: 1 },
    { name: "experienceCertificate", maxCount: 1 },
    { name: "degreeCertificate", maxCount: 1 },
  ]),
  addFaculty
);

// ✏️ Update faculty
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

/* ============================ PROTECTED ROUTES ============================ */
router.use(verifyToken);

// 📤 Bulk upload (Excel)
router.post("/upload", uploadExcel.single("file"), uploadMultipleFaculty);

// 📋 Get all faculty
router.get("/", getAllFaculty);

// 📊 Department-wise faculty count
router.get("/department-wise", getDepartmentWise);

// 📈 Dashboard stats
router.get("/stats", getDashboardStats);

// 🧑‍🏫 Faculty list for specific department
router.get("/department-wise/:department", getDepartmentWiseFaculty);

//department wise faculty list 

router.get("/department/:department", verifyToken, getDepartmentWiseFacultyList);


export default router;
