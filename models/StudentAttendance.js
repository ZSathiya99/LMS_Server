import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    rollNo: String,
    name: String,

    department: String,
    year: String,
    subjectCode: String,
    section: String,

    date: String, // "04-12-2025"
    hour: String, // "1st Hour (08:40AM - 09:30AM)"

    status: {
      type: String,
      enum: ["Present", "Absent", "On-Duty"],
      default: "Present",
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
    },
  },
  { timestamps: true }
);

export default mongoose.model("StudentAttendance", attendanceSchema);
