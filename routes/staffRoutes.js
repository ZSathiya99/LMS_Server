// routes/staffRoutes.js
import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import {
  getStaffSubjectPlanning,
  joinClassroom,
  sendInvitation,
  respondInvitation,getStudentClassroom
} from '../controllers/staffController.js';
import ClassroomMembers from '../models/ClassroomMembers.js';

const router = express.Router();

// 👨‍🏫 Staff Subject Planning
router.get('/staff/subject-planning', verifyToken, getStaffSubjectPlanning);
router.post('/classroom/:code/join', verifyToken, joinClassroom);
router.post('/staff/classroom/:sectionId/invite', verifyToken, sendInvitation);
router.post('/classroom/invitations/respond', verifyToken, respondInvitation);

// student login ClassroomMembers
router.get("/student/classroom", verifyToken, getStudentClassroom);

export default router;
