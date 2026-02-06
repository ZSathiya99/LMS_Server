import express from "express";
import { uploadDocuments } from "../middleware/upload.js";
import { verifyToken } from "../middleware/authMiddleware.js";

import {
  createQuestion,
  getQuestions,
  getSingleQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";

const router = express.Router();

// ✅ POST
router.post(
  "/staff/question",
  verifyToken,
  uploadDocuments.array("attachments", 5),
  createQuestion
);

// ✅ GET All
router.get(
  "/staff/questions/:subjectId",
  verifyToken,
  getQuestions
);

// ✅ GET Single
router.get(
  "/staff/question/:questionId",
  verifyToken,
  getSingleQuestion
);

// ✅ PUT
router.put(
  "/staff/question/:questionId",
  verifyToken,
  uploadDocuments.array("attachments", 5),
  updateQuestion
);

// ✅ DELETE
router.delete(
  "/staff/question/:questionId",
  verifyToken,
  deleteQuestion
);

export default router;
