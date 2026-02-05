import mongoose from "mongoose";

/* =========================================
   🔥 COMMENT SCHEMA
========================================= */
const CommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    role: {
      type: String,
      enum: ["staff", "student"], // 🔥 restrict values
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    profileImg: {
      type: String,
      default: "",
    },

    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // 🔥 adds createdAt & updatedAt for comments
  }
);


/* =========================================
   🔥 STREAM SCHEMA
========================================= */
const StreamSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    attachments: {
      type: [String], // store file URLs
      default: [],
    },

    link: {
      type: String,
      default: "",
      trim: true,
    },

    youtubeLink: {
      type: String,
      default: "",
      trim: true,
    },

    comments: {
      type: [CommentSchema],
      default: [],
    },
  },
  {
    timestamps: true, // 🔥 adds createdAt & updatedAt for stream
  }
);


/* =========================================
   🔥 INDEXES (Performance Optimization)
========================================= */

// For faster fetching by subject + staff
StreamSchema.index({ subjectId: 1, staffId: 1 });

// For faster comment lookup (optional)
StreamSchema.index({ "comments.userId": 1 });

export default mongoose.model("Stream", StreamSchema);
