import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadDocuments } from "../middleware/upload.js";

import {
  createQuestion,
  getQuestions,
  getSingleQuestion,
  updateQuestion,
  deleteQuestion,
  addQuestionComment,
  deleteQuestionComment,
  submitQuestion,
  getFullQuestionDetails,
} from "../controllers/questionController.js";

const router = express.Router();

/* ======================================================
   QUESTION CRUD
====================================================== */

/* CREATE QUESTION */
router.post(
  "/question",
  verifyToken,
  uploadDocuments.array("attachments", 5),
  createQuestion
);

/* GET ALL QUESTIONS BY SUBJECT */
router.get(
  "/question/subject/:subjectId",
  verifyToken,
  getQuestions
);

/* GET SINGLE QUESTION */
router.get(
  "/question/:questionId",
  verifyToken,
  getSingleQuestion
);

/* UPDATE QUESTION */
router.put(
  "/question/:questionId",
  verifyToken,
  uploadDocuments.array("attachments", 5),
  updateQuestion
);

/* DELETE QUESTION */
router.delete(
  "/question/:questionId",
  verifyToken,
  deleteQuestion
);

/* ======================================================
   COMMENTS
====================================================== */

/* ADD COMMENT */
router.post(
  "/question/:questionId/comment",
  verifyToken,
  addQuestionComment
);

/* DELETE COMMENT */
router.delete(
  "/question/:questionId/comment/:commentId",
  verifyToken,
  deleteQuestionComment
);

/* ======================================================
   STUDENT SUBMISSION
====================================================== */

/* SUBMIT QUESTION */
router.post(
  "/question/:questionId/submit",
  verifyToken,
  submitQuestion
);

/* ======================================================
   FULL DETAILS (OVERALL)
====================================================== */

/* GET FULL QUESTION DETAILS */
router.get(
  "/question/full/:questionId",
  verifyToken,
  getFullQuestionDetails
);

export default router;
