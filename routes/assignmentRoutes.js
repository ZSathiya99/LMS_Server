import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

import {
  createAssignment,
  getAssignmentsBySubject,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignmentController.js";
import { uploadDocuments } from "../middleware/upload.js"

const router = express.Router();


router.post(
  "/assignment",
  verifyToken,
  uploadDocuments.array("attachments", 5), // max 5 files
  createAssignment
);
router.get("/assignment/:subjectId", verifyToken, getAssignmentsBySubject);
router.get("/assignment/single/:assignmentId", verifyToken, getSingleAssignment);
router.put("/assignment/:assignmentId", verifyToken, updateAssignment);
router.delete("/assignment/:assignmentId", verifyToken, deleteAssignment);

export default router;
