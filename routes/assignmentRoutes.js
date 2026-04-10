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
  gradeSubmission,deleteMySubmission,
  getStudentAssignments,getMySubmission,getAssignmentStudentStatus,addMarks,removeSingleFile

  // getAssignmentDetails,
} from '../controllers/assignmentController.js';
import Student from '../models/Student.js';

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
  "/submit-assignment/:assignmentId",
  verifyToken,
  uploadDocuments.array("attachments", 5), // ✅ multiple files
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


//Student get api
router.get(
  "/student/assignments/:subjectId/:sectionId",
  verifyToken,
  getStudentAssignments
);
// ✅ Get My Submission
router.get(
  "/my-submission/:assignmentId",
  verifyToken,
  getMySubmission
);

// ✅ Delete My Submission
router.delete(
  "/delete-submission/:assignmentId",
  verifyToken,
  deleteMySubmission
);
// ✅ Remove single file from submission
router.delete(
  "/remove-file/:assignmentId",
  verifyToken,
  removeSingleFile
);

router.get(
  "/assignment-status/:assignmentId/:sectionId",
  verifyToken,
  getAssignmentStudentStatus
);
router.post(
  "/assignment-marks/:assignmentId/:studentId",
  verifyToken,
  addMarks
);

export default router;
