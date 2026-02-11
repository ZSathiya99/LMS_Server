import express from 'express';
import { getMyJoinedClasses } from '../controllers/studentClassroomController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/my', verifyToken, getMyJoinedClasses);

export default router;
