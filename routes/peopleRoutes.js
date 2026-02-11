import express from 'express';
import {
  getClassMembers,
  removeClassroomMember
} from '../controllers/peopleController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/joined/:sectionId', verifyToken, getClassMembers);
router.delete('/remove/:sectionId/:userId', verifyToken, removeClassroomMember);

export default router;
