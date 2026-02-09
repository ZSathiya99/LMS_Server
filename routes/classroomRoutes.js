import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  createClassroom,
  getFacultyClassrooms,
  joinClassroom,
  sendInvitation,
  respondInvitation
} from '../controllers/classroomController.js';

const router = express.Router();

router.post('/staff/classroom', verifyToken, createClassroom);
router.get('/staff/classroom', verifyToken, getFacultyClassrooms);

// Join classroom
router.post('/classroom/:classId/join', verifyToken, joinClassroom);

// Invitations
router.post('/staff/classroom/:classId/invite', verifyToken, sendInvitation);
router.post('/classroom/invitations/respond', verifyToken, respondInvitation);

export default router;
