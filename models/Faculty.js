// models/Faculty.js
import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema(
  {
    salutation: String,

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: String,
    dateOfBirth: Date,

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true, // hashed
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    department: {
      type: String,
      required: true,
    },

    // 🔐 ROLE-BASED ACCESS (Single Source of Truth)
    role: {
      type: String,
      enum: [
        "faculty",
        "HOD",
        "Dean",
        "Professor",
        "Assistant Professor",
        "Associate Professor",
        "admin",
      ],
      default: "faculty",
    },

    // ✅ Only filled if role === "HOD"
    hodDepartment: {
      type: String,
      default: null,
    },

    designation: String,
    qualification: String,
    workType: String,
    joiningDate: Date,
    reportingManager: String,
    noticePeriod: String,

    documents: {
      markSheet: String,
      experienceCertificate: String,
      degreeCertificate: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Faculty", FacultySchema);
