import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { uploadDocuments } from '../middleware/upload.js';

import {
  createMaterial,
  getMaterialsBySubject,
  getSingleMaterial,
  updateMaterial,
  deleteMaterial,
  addMaterialComment,
  editMaterialComment,
  deleteMaterialComment
} from '../controllers/materialController.js';

const router = express.Router();

/* =====================================================
   MATERIAL CRUD
===================================================== */

/* CREATE MATERIAL */
router.post(
  '/material',
  verifyToken,
  uploadDocuments.array('attachments', 5),
  createMaterial
);

/* GET ALL MATERIALS BY SUBJECT */
router.get(
  '/material/subject/:subjectId/:sectionId',
  verifyToken,
  getMaterialsBySubject
);

/* GET SINGLE MATERIAL */
router.get('/material/:materialId', verifyToken, getSingleMaterial);

/* UPDATE MATERIAL */
router.put('/material/:materialId', verifyToken, updateMaterial);

/* DELETE MATERIAL */
router.delete('/material/:materialId', verifyToken, deleteMaterial);

/* =====================================================
   COMMENTS
===================================================== */

/* ADD COMMENT */
router.post('/material/:materialId/comment', verifyToken, addMaterialComment);

/* EDIT COMMENT */
router.put(
  '/material/:materialId/comment/:commentId',
  verifyToken,
  editMaterialComment
);

/* DELETE COMMENT */
router.delete(
  '/material/:materialId/comment/:commentId',
  verifyToken,
  deleteMaterialComment
);

export default router;
