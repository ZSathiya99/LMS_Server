import express from "express";
import {
  addAdminAllocation,
  allocateSubjects,
} from "../controllers/adminAllocationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addAdminAllocation);
router.post("/subjects", verifyToken, allocateSubjects);

export default router;
