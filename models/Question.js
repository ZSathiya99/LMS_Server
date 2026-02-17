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
   SUBMISSION SUB-SCHEMA
   (For student answers)
================================ */
const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },

    // For MCQ answers
    selectedOptions: [String],

    attachment: String, // optional (if file upload question)

    marksObtained: {
      type: Number,
      default: null
    },

    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

/* ================================
   MAIN QUESTION SCHEMA
================================ */
const questionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
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

    questionType: {
      type: String,
      enum: ['Single Choice', 'Multiple Choice'],
      required: true
    },

    instruction: String,

    attachments: [String],

    marks: {
      type: Number,
      required: true
    },

    /* =====================
       OPTIONS FOR MCQ
    ====================== */
    options: [
      {
        text: {
          type: String
        }
      }
    ],

    link: String,
    youtubeLink: String,

    dueDate: {
      type: Date,
      required: true
    },

    /* 🔥 EMBEDDED DATA */
    comments: [commentSchema],

    submissions: [submissionSchema]
  },
  { timestamps: true }
);

export default mongoose.model('Question', questionSchema);
