import mongoose from "mongoose";

/* ================================
   COMMENT SUB-SCHEMA
================================ */
const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    userType: {
      type: String,
      enum: ["staff", "student"],
      required: true,
    },

    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

/* ================================
   SUBMISSION SUB-SCHEMA
================================ */
const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    attachment: String,

    marksObtained: {
      type: Number,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* ================================
   MAIN ASSIGNMENT SCHEMA
================================ */
const assignmentSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    instruction: String,

    attachments: [String],

    link: String,

    youtubeLink: String,

    marks: {
      type: Number,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    /* 🔥 EMBEDDED DATA */

    comments: [commentSchema],

    submissions: [submissionSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);
