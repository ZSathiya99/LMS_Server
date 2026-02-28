import express from "express";
import { getCourseHTML } from "../controllers/generatePdfController.js";

const router = express.Router();

/* 1️⃣ PDF ROUTE FIRST */
router.get(
  "/generatePdf/:subject_id/:section_id",
  getCourseHTML
);

export default router;