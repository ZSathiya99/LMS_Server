import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { uploadDocuments } from '../middleware/upload.js';

import {
  createAssignment,
  getAssignmentsBySubject,
  getSingleAssignment,
  updateAssignment,
  deleteAssignment,
  addAssignmentComment,
  submitAssignment,
  gradeSubmission
  // getAssignmentDetails,
} from '../controllers/assignmentController.js';

const router = express.Router();

/* =====================================================
   ASSIGNMENT CRUD (STAFF)
===================================================== */

// Create assignment
router.post(
  '/assignment',
  verifyToken,
  uploadDocuments.array('attachments', 5),
  createAssignment
);

// Get all assignments by subject
router.get(
  '/assignment/subject/:subjectId/:sectionId',
  verifyToken,
  getAssignmentsBySubject
);

// Get single assignment
router.get('/assignment/:assignmentId', verifyToken, getSingleAssignment);

// Update assignment
router.put('/assignment/:assignmentId', verifyToken, updateAssignment);

// Delete assignment
router.delete('/assignment/:assignmentId', verifyToken, deleteAssignment);

/* =====================================================
   ASSIGNMENT COMMENTS (STAFF / STUDENT)
===================================================== */

router.post(
  '/assignment/:assignmentId/comment',
  verifyToken,
  addAssignmentComment
);

/* =====================================================
   STUDENT SUBMISSION
===================================================== */

router.post(
  '/assignment/:assignmentId/submit',
  verifyToken,
  uploadDocuments.single('attachment'),
  submitAssignment
);

/* =====================================================
   STAFF GRADING
===================================================== */

router.put(
  '/assignment/submission/:submissionId/grade',
  verifyToken,
  gradeSubmission
);

/* =====================================================
   FULL ASSIGNMENT DETAILS (UI MAIN API)
===================================================== */

// router.get(
//   "/assignment/:assignmentId/details",
//   verifyToken,
//   getAssignmentDetails
// );

export default router;
