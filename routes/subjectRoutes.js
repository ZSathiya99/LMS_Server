import express from "express";
import { getSubjectsByDepartment,addSubject,uploadSubjectsFromExcel } from "../controllers/subjectController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadExcel } from "../middleware/upload.js";

const router = express.Router();


// router.get("/:department", verifyToken, getDepartmentSubjects);
router.get("/:department", verifyToken, getSubjectsByDepartment);

router.post("/", verifyToken, addSubject);
router.post(
  "/uploadExcel",
  verifyToken,
  uploadExcel.single("file"),
  uploadSubjectsFromExcel
);

export default router;
