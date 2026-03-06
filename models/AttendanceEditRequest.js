import mongoose from "mongoose";

const attendanceEditRequestSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
      index: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    // store as Date
    date: {
      type: Date,
      required: true,
      index: true,
    },

    // same format used in StudentAttendance
    hour: {
      type: String,
      required: true,
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

    hourLabel: {
      type: String,
      required: true,
      trim: true,
    },

    currentStatus: {
      type: String,
      enum: ["Present", "Absent", "On-Duty"],
      required: true,
    },

    requestedStatus: {
      type: String,
      enum: ["Present", "Absent", "On-Duty"],
      required: true,
    },

    reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    hodActionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
    },

    hodActionDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

/* Prevent duplicate pending requests */

attendanceEditRequestSchema.index(
  { studentId: 1, subjectId: 1, date: 1, hour: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "Pending" } },
);

export default mongoose.model(
  "AttendanceEditRequest",
  attendanceEditRequestSchema,
);
