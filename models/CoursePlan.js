import mongoose from "mongoose";

const CoursePlanSchema = new mongoose.Schema({

  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },

  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  department: String,
  semester: Number,

  // 🔹 STEP 1 – COURSE DETAILS
  courseDetails: {
    courseType: String,
    coRequisites: String,
    preRequisites: String,
    courseDescription: String,
    courseObjectives: [String],
    courseOutcomes: [
      {
        unit: String,
        statement: String,
        rtbl: String
      }
    ]
  },

  // 🔹 STEP 2 – CO-PO Mapping
  coPoMapping: [
    {
      co: String,
      po: String,
      justification: String,
      level: Number
    }
  ],

  // 🔹 STEP 3 – Reference & Others
  references: {
    textBooks: [String],
    referenceBooks: [String],
    journals: [String],
    webResources: [String],
    moocCourses: [
      {
        platform: String,
        courseName: String
      }
    ],
    projects: [String],
    termWork: Boolean,
    gapIdentification: Boolean
  },

  // 🔹 STEP 4 – Lesson Planner
  lessonPlanner: {
    theory: [
      {
        unit: String,
        topic: String,
        pedagogy: String,
        reference: String
      }
    ],
    lab: [
      {
        experiment: String,
        objective: String
      }
    ]
  },

  completionPercentage: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

CoursePlanSchema.index({ subjectId: 1, sectionId: 1 }, { unique: true });

export default mongoose.model("CoursePlan", CoursePlanSchema);