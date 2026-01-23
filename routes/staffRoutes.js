// routes/staffRoutes.js
import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getStaffSubjectPlanning } from "../controllers/staffController.js";


const router = express.Router();

// 👨‍🏫 Staff Subject Planning
router.get(
  "/staff/subject-planning",
  verifyToken,
  getStaffSubjectPlanning
);

export default router;
