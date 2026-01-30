import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  createClassroom,
  getFacultyClassrooms,
} from "../controllers/classroomController.js";

const router = express.Router();

router.post("/staff/classroom", verifyToken, createClassroom);
router.get("/staff/classroom", verifyToken, getFacultyClassrooms);

export default router;
