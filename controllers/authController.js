import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { sendMail } from "../utils/sendMail.js";
import { renderTemplate } from "../utils/renderTemplate.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";

// =======================================
// REGISTER
// =======================================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check existing user
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    // Create new user (password auto-hashed in model)
    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================================
// LOGIN
// =======================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ================================
    // 1. FIND USER
    // ================================
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    // ================================
    // 2. VERIFY PASSWORD
    // ================================
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    let faculty = null;
    let profileImage = null;
    let department = "";

    // ================================
    // 3. FACULTY / HOD / DEAN LOGIN
    // ================================
    if (
      [
        "faculty",
        "HOD",
        "Dean",
        "Professor",
        "Assistant Professor",
        "Associate Professor",
      ].includes(user.role)
    ) {
      faculty = await Faculty.findOne({ email });

      if (!faculty) {
        return res.status(404).json({
          message: "Faculty profile not found. Contact Admin.",
        });
      }

      profileImage = faculty.profileImage || null;
      department = faculty.department || "";
    }

    // ================================
    // 4. STUDENT LOGIN
    // ================================
    if (user.role === "student") {
      const student = await Student.findOne({ email });

      if (!student) {
        return res.status(404).json({
          message: "Student profile not found. Contact Admin.",
        });
      }

      profileImage = student.profileImage || null;
      department = student.department || "";
    }

    // ================================
    // 5. GENERATE TOKEN (WITH PROFILE IMAGE)
    // ================================
    const token = generateToken(
      user._id,
      user.role,
      user.name,
      user.email,
      faculty ? faculty._id : null,
      department,
      profileImage
    );

    // ================================
    // 6. FINAL RESPONSE
    // ================================
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        facultyId: faculty ? faculty._id : null,
        department,
        profileImage, // ✅ also in response
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// =======================================
// FORGOT PASSWORD (Send OTP)
// =======================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(404).json({ message: "User not found for this email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const htmlContent = renderTemplate("forgotPassword", {
      name: user.name,
      otp,
      email: user.email,
      frontendUrl: process.env.FRONTEND_URL,
    });

    await sendMail(email, "Password Reset OTP", htmlContent);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================================
// RESET PASSWORD
// =======================================
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (
      !user.resetOtp ||
      user.resetOtp !== otp ||
      user.resetOtpExpiry < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword; // auto-hashed
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================================
// CHANGE PASSWORD
// =======================================
export const changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect old password" });

    user.password = newPassword; // auto-hashed
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
