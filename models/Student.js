import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
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

    // unique ID given by college
    registerNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // optional roll number (class-wise)
    rollNumber: {
      type: String,
      trim: true,
    },

    department: {
      type: String,
      required: true,
      trim: true, // e.g. "CSE"
    },

    // Stored as string because you use "First Year", "Second Year" etc.
    year: {
      type: String,
      required: true,
      enum: ["First Year", "Second Year", "Third Year", "Fourth Year"],
    },

    section: {
      type: String, // e.g. "A", "B"
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    profileImage: {
      type: String, // URL or file path
      default: null,
    },

    mobileNumber: {
      type: String,
      trim: true,
    },

    // already hashed in controller
    password: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

const Student = mongoose.model("Student", studentSchema);

export default Student;
