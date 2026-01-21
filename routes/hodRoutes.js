import express from "express";
import { allocateHOD } from "../controllers/hodController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin / HOD allocation
router.post("/admin/allocate-hod", verifyToken, allocateHOD);

export default router;
