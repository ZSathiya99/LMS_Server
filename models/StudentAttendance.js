import mongoose from "mongoose";

const studentAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },

    hour: {
      type: String, // "1st Hour", "2nd Hour"
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "On-Duty"],
      required: true,
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
  },
  { timestamps: true }
);

// 🔥 UNIQUE — Only one record per student per hour per subject per day
studentAttendanceSchema.index(
  { studentId: 1, subjectId: 1, date: 1, hour: 1 },
  { unique: true }
);

export default mongoose.model("StudentAttendance", studentAttendanceSchema);
