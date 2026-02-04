import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

import {
  createStreamPost,
  getStreamBySubject,
  deleteStreamPost,
  updateStreamPost,
} from "../controllers/streamController.js";

const router = express.Router();

/**
 * 🔥 Create New Announcement
 * POST /api/staff/stream
 */
router.post(
  "/stream",
  verifyToken,
  createStreamPost
);

/**
 * 🔥 Get Stream By Subject
 * GET /api/staff/stream/:subjectId
 */
router.get(
  "/stream/:subjectId",
  verifyToken,
  getStreamBySubject
);

/**
 * 🔥 Update Stream Post
 * PUT /api/staff/stream/:streamId
 */
router.put(
  "/stream/:streamId",
  verifyToken,
  updateStreamPost
);

/**
 * 🔥 Delete Stream Post
 * DELETE /api/staff/stream/:streamId
 */
router.delete(
  "/stream/:streamId",
  verifyToken,
  deleteStreamPost
);

export default router;
