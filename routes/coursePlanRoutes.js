import express from "express";
import {
  saveCoursePlan,
  getCoursePlan
} from "../controllers/coursePlanController.js";

const router = express.Router();

router.post("/save", saveCoursePlan);
router.get("/:subjectId/:sectionId", getCoursePlan);

export default router;