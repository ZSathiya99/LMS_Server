import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { uploadDocuments } from '../middleware/upload.js';

import {
  createQuestion,
  getQuestionsData,
  addQuestionComment,
  deleteQuestionComment,
  submitQuestion
} from '../controllers/questionController.js';

const router = express.Router();

/* ================================
   CREATE QUESTION
================================ */
router.post(
  '/question',
  verifyToken,
  uploadDocuments.array('attachments', 5),
  createQuestion
);

/* ================================
   GET (LIST OR FULL DETAILS)
   Use Query Params:
   ?subjectId=xxxx
   ?questionId=xxxx
================================ */
router.get('/question/:subjectId/:sectionId', verifyToken, getQuestionsData);

/* ================================
   ADD COMMENT
================================ */
router.post('/question/:questionId/comment', verifyToken, addQuestionComment);

/* ================================
   DELETE COMMENT
================================ */
router.delete(
  '/question/:questionId/comment/:commentId',
  verifyToken,
  deleteQuestionComment
);

/* ================================
   SUBMIT QUESTION
================================ */
router.post('/question/:questionId/submit', verifyToken, submitQuestion);

export default router;
