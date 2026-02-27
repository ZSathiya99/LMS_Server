import express from "express";
import { getCourseHTML } from "../controllers/generatePdfController.js";

const router = express.Router();

router.get("/:subject_id", getCourseHTML);

export default router;
