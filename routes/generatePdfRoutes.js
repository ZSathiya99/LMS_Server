import express from "express";
import { getCourseHTML } from "../controllers/generatePdfController";

const router = express.Router();

router.get("/course_plan/generatePdf", getCourseHTML);

export default router