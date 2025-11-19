import express from "express";
import {
  addAdminAllocation,
  allocateSubjects,
  getAllocatedSubjects,
} from "../controllers/adminAllocationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, addAdminAllocation);
router.post("/subjects", verifyToken, allocateSubjects);
router.get("/get",verifyToken, getAllocatedSubjects);

export default router;
