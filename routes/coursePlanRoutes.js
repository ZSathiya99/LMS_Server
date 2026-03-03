import express from 'express';
import {
  updateCoursePlanStep,
  getCoursePlanStep,
  deleteTheoryPlannerTopic
} from '../controllers/coursePlanController.js';

import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// router.post("/save", saveCoursePlan);
// router.get("/:subjectId/:sectionId", getCoursePlan);

router.patch('/:step', verifyToken, updateCoursePlanStep);
router.get('/:step/:sectionId/:subjectId', verifyToken, getCoursePlanStep);

router.delete(
  '/theoryPlanner/deleteTopic',
  verifyToken,
  deleteTheoryPlannerTopic
);

export default router;
