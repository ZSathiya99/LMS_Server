import express from "express";
import { getSubjectsByDepartment,addSubject,uploadSubjectsFromExcel,updateSubject,deleteSubject } from "../controllers/subjectController.js";
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
// UPDATE Subject
router.put("/subjects/update/:id",verifyToken, updateSubject);

// DELETE Subject
router.delete("/subjects/delete/:id",verifyToken, deleteSubject);


export default router;
