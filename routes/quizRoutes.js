import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  getQuizSubmissions,
  submitQuiz,
  deleteQuiz,
  updateQuiz
} from '../controllers/quizController.js';

const router = express.Router();

// CREATE QUIZ
router.post('/', verifyToken, createQuiz);

// GET QUIZZES
router.get('/:subjectId/:sectionId', verifyToken, getQuizzes);

// GET SINGLE QUIZ
router.get('/:id', verifyToken, getQuizById);

// SUBMIT QUIZ
router.post('/:id/submit', verifyToken, submitQuiz);

// GET SUBMISSIONS
router.get('/:id/submissions', verifyToken, getQuizSubmissions);

// DELETE QUIZ
router.delete('/:id', verifyToken, deleteQuiz);

// UPDATE QUIZ
router.put('/:id', verifyToken, updateQuiz);

export default router;
