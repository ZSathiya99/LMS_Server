import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';

import {
  createStreamPost,
  getStreamBySubject,
  deleteStreamPost,
  updateStreamPost,
  addCommentToStream,
  deleteCommentFromStream
} from '../controllers/streamController.js';
import { uploadDocuments } from '../middleware/upload.js'; // ✅ FIXED

const router = express.Router();

/**
 * 🔥 Create New Announcement
 * POST /api/staff/stream
 */
router.post(
  '/stream',
  verifyToken,
  uploadDocuments.array('attachments', 5), // max 5 files
  createStreamPost
);

/**
 * 🔥 Get Stream By Subject
 * GET /api/staff/stream/:subjectId
 */
router.get('/stream/:subjectId/:sectionId', verifyToken, getStreamBySubject);

/**
 * 🔥 Update Stream Post
 * PUT /api/staff/stream/:streamId
 */
router.put(
  '/stream/:streamId',
  verifyToken,
  uploadDocuments.array('attachments', 5), // 🔥 IMPORTANT
  updateStreamPost
);

/**
 * 🔥 Delete Stream Post
 * DELETE /api/staff/stream/:streamId
 */
router.delete('/stream/:streamId', verifyToken, deleteStreamPost);

router.post('/stream/:streamId/comment', verifyToken, addCommentToStream);
router.delete(
  '/stream/:streamId/comment/:commentId',
  verifyToken,
  deleteCommentFromStream
);

export default router;
