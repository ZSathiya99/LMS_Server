import express from "express";
import { getCourseHTML } from "../controllers/generatePdfController.js";

const router = express.Router();

router.get("/", getCourseHTML);

export default router;
