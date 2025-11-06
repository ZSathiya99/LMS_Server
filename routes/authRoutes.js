import express from "express";
import { registerUser, loginUser, forgotPassword, resetPassword, changePassword } from "../controllers/authController.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router .post("/forgot",forgotPassword);
router.post("/reset",resetPassword);
router.post("/change",changePassword);


export default router;
