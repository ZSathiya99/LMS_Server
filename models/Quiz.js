import mongoose from 'mongoose';
// Submission sub-schema
const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    answers: [
      {
        questionIndex: Number,
        selectedOptions: [Number] // indices of selected options
      }
    ],
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

const quizSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  sectionId: {
    type: String,
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  // instruction removed
  dueDate: {
    type: Date,
    required: true
  },
  sectionId: {
    type: String,
    required: true
  },
  marks: {
    type: Number,
    required: true,
    default: function () {
      return this.questions.length;
    }
  },
  questions: [
    {
      questionText: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        enum: ['single', 'multiple'],
        default: 'single'
      },
      options: [
        {
          type: String,
          required: true,
          trim: true
        }
      ],
      correctAnswers: [
        {
          type: Number, // Stores the indices of the correct options
          required: true
        }
      ]
    }
  ],
  // comments removed
  submissions: [submissionSchema],
  itemType: {
    type: String,
    default: 'quiz'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
