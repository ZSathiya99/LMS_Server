import mongoose from "mongoose";

const studentAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    // ✅ Better to store Date type instead of String
    date: {
      type: Date,
      required: true,
    },

    hour: {
      type: String,
      required: true,
      trim: true,
      enum: [
        "1stHour",
        "2ndHour",
        "3rdHour",
        "4thHour",
        "5thHour",
        "6thHour",
        "7thHour",
        "8thHour",
      ],
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
  {
    timestamps: true,
  }
);

// ✅ Unique: One attendance per student per subject per hour per day
studentAttendanceSchema.index(
  { studentId: 1, subjectId: 1, date: 1, hour: 1 },
  { unique: true }
);

export default mongoose.model("StudentAttendance", studentAttendanceSchema);
