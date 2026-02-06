import express from "express";
import { uploadDocuments } from "../middleware/upload.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  createMaterial,
  getMaterials,
  getSingleMaterial,
  updateMaterial,
  deleteMaterial,
} from "../controllers/materialController.js";

const router = express.Router();

// ✅ POST (form-data)
router.post(
  "/staff/material",
  verifyToken,
  uploadDocuments.array("attachments", 5),
  createMaterial
);

// ✅ GET All
router.get(
  "/staff/materials/:subjectId",
  verifyToken,
  getMaterials
);

// ✅ GET Single
router.get(
  "/staff/material/:materialId",
  verifyToken,
  getSingleMaterial
);

// ✅ PUT (form-data)
router.put(
  "/staff/material/:materialId",
  verifyToken,
  uploadDocuments.array("attachments", 5),
  updateMaterial
);

// ✅ DELETE
router.delete(
  "/staff/material/:materialId",
  verifyToken,
  deleteMaterial
);

export default router;
