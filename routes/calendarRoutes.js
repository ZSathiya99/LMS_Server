import express from 'express';
import { getYearlyCalendarData } from '../controllers/calendarController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/events', verifyToken, getYearlyCalendarData);

export default router;
