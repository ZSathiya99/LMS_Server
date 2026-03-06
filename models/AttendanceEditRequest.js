import mongoose from "mongoose";

const attendanceEditRequestSchema = new mongoose.Schema(
{
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
    index: true
  },

  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
    index: true
  },

  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    index: true
  },

  // ✅ Better to store Date type
  date: {
    type: Date,
    required: true,
    index: true
  },

  // for backend filtering
  hourNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    index: true
  },

  // for UI display
  hourLabel: {
    type: String,
    required: true,
    trim: true
  },

  currentStatus: {
    type: String,
    enum: ["Present", "Absent", "OnDuty"],
    required: true
  },

  requestedStatus: {
    type: String,
    enum: ["Present", "Absent", "OnDuty"],
    required: true
  },

  reason: {
    type: String,
    trim: true
  },

  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
    index: true
  },

  // HOD who approved/rejected
  hodActionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty"
  },

  // when HOD took action
  hodActionDate: {
    type: Date
  }

},
{ timestamps: true }
);

/* =====================================================
   Prevent duplicate pending requests
===================================================== */

attendanceEditRequestSchema.index(
  { studentId: 1, subjectId: 1, date: 1, hourNumber: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "Pending" } }
);

export default mongoose.model(
  "AttendanceEditRequest",
  attendanceEditRequestSchema
);