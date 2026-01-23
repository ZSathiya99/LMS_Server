import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  addNewTopic,
  editTopic,
  deleteTopic,getSubjectTopics
} from "../controllers/subjectPlanningController.js";

const router = express.Router();
// router.get(
//   "/staff/subject-planning",
//   verifyToken,
//   getStaffSubjectPlanning
// );
// GET → Fetch topics
router.get(
  "/subject-planning/topics/:subjectId",
  verifyToken,
  getSubjectTopics
);

router.post("/staff/subject-planning/topic", verifyToken, addNewTopic);
router.put("/staff/subject-planning/topic/:topicId", verifyToken, editTopic);
router.delete("/staff/subject-planning/topic/:topicId", verifyToken, deleteTopic);

export default router;
