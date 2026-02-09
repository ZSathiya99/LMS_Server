// routes/staffRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getStaffSubjectPlanning,
  joinClassroom,
  sendInvitation,
  respondInvitation
} from '../controllers/staffController.js';

const router = express.Router();

// 👨‍🏫 Staff Subject Planning
router.get('/staff/subject-planning', verifyToken, getStaffSubjectPlanning);
router.post('/staff/classroom/:classId/join', verifyToken, joinClassroom);
router.post('/staff/classroom/:classId/invite', verifyToken, sendInvitation);
router.post('/classroom/invitations/respond', verifyToken, respondInvitation);

export default router;
