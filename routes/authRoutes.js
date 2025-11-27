import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);
router.get("/fix-user", async (req, res) => {
  const emails = [
    
    //MECH
    "priyasharma27@college.edu",
    //CIVIL
    "sathiyaraj30@college.edu",
    //EEE
    "arunsharma59@college.edu",
    //CSE
    "arunraj88@college.edu",
    //admin
    "sathiyavijaya1999@gmail.com"
  ];

  const users = await User.find({ email: { $in: emails } });

  if (users.length === 0) return res.send("No users found");

  for (const user of users) {
    user.password = "123456"; // will get hashed
    await user.save();
  }

  res.send(`Password reset for ${users.length} users.`);
});



export default router;
