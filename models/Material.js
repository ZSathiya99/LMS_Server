import mongoose from 'mongoose';

/* ================================
   COMMENT SUB-SCHEMA
================================ */
const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    userType: {
      type: String,
      enum: ['staff', 'student'],
      required: true
    },

    comment: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

/* ================================
   MAIN MATERIAL SCHEMA
================================ */
const materialSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Subject'
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Faculty'
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true
    },

    instruction: {
      type: String,
      default: ''
    },

    attachments: [String],

    link: {
      type: String,
      default: ''
    },

    youtubeLink: {
      type: String,
      default: ''
    },

    /* 🔥 EMBEDDED COMMENTS */
    comments: [commentSchema]
  },
  { timestamps: true }
);

export default mongoose.model('Material', materialSchema);
