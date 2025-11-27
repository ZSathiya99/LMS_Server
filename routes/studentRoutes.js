import express from "express";
import {
  addStudent,
  updateStudent,
  deleteStudent,
  uploadMultipleStudents,
  getAllStudents,
  getStudentDepartmentWise,
  getStudentsByDeptPie,
  getStudentDashboard,
  getStudentsFiltered,getDepartmentSummary
} from "../controllers/studentController.js";

import { uploadExcel } from "../middleware/upload.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// 📌 STUDENT ROUTES
// ==============================

// ➕ Add Single Student
router.post("/add", verifyToken, addStudent);

// ✏ Update Student
router.put("/update/:id", verifyToken, updateStudent);

// ❌ Delete Student
router.delete("/delete/:id", verifyToken, deleteStudent);

// 📤 Upload Multiple Students (Excel)
router.post("/upload", verifyToken, uploadExcel.single("file"), uploadMultipleStudents);

// 📥 Get All Students
router.get("/", verifyToken, getAllStudents);

// 📊 Department-wise Count
router.get("/department-wise", verifyToken, getStudentDepartmentWise);

// 🥧 Year-wise Pie Chart by Department
router.get("/department-wise/:department", verifyToken, getStudentsByDeptPie);

// 🏠 Dashboard (Total + Year-wise)
router.get("/dashboard", verifyToken, getStudentDashboard);
// GET STUDENTS BY Department + Year + Section

router.get("/filter",verifyToken, getStudentsFiltered);

router.get("/department-summary",verifyToken, getDepartmentSummary);



export default router;
