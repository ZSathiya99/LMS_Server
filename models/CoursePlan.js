import mongoose from 'mongoose';

const { Schema } = mongoose;

/* =========================
   Sub Schemas
========================= */

const mappingItemSchema = new Schema(
  {
    justification: { type: String, trim: true, default: '' },
    credit: { type: Number, default: 0 }
  },
  { _id: false }
);

const courseOutcomeSchema = new Schema(
  {
    unit: { type: String, required: true, trim: true },
    statement: { type: String, default: '', trim: true },
    rtbl: {
      type: String,
      enum: ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'],
      required: true
    }
  },
  { _id: false }
);

const courseDetailsSchema = new Schema(
  {
    courseType: {
      type: String,
      enum: ['T', 'TP', 'TPJ', 'P', 'PJ', 'I'],
      required: true
    },
    preRequisites: { type: String, default: '', trim: true },
    coRequisites: { type: String, default: '', trim: true },
    courseDescription: { type: String, default: '', trim: true },
    courseObjectives: { type: String, default: '', trim: true },
    courseOutcomes: { type: [courseOutcomeSchema], default: [] }
  },
  { _id: false }
);

const coPoSchema = new Schema(
  {
    PO0: { type: mappingItemSchema, default: () => ({}) },
    PO1: { type: mappingItemSchema, default: () => ({}) },
    PO2: { type: mappingItemSchema, default: () => ({}) },
    PO3: { type: mappingItemSchema, default: () => ({}) },
    PO4: { type: mappingItemSchema, default: () => ({}) },
    PO5: { type: mappingItemSchema, default: () => ({}) },
    PO6: { type: mappingItemSchema, default: () => ({}) },
    PO7: { type: mappingItemSchema, default: () => ({}) },
    PO8: { type: mappingItemSchema, default: () => ({}) },
    PO9: { type: mappingItemSchema, default: () => ({}) },
    PO10: { type: mappingItemSchema, default: () => ({}) },
    PO11: { type: mappingItemSchema, default: () => ({}) },
    PSO1: { type: mappingItemSchema, default: () => ({}) },
    PSO2: { type: mappingItemSchema, default: () => ({}) },
    PSO3: { type: mappingItemSchema, default: () => ({}) }
  },
  { _id: false }
);

const coPoMappingSchema = new Schema(
  {
    CO1: { type: coPoSchema, default: () => ({}) },
    CO2: { type: coPoSchema, default: () => ({}) },
    CO3: { type: coPoSchema, default: () => ({}) },
    CO4: { type: coPoSchema, default: () => ({}) },
    CO5: { type: coPoSchema, default: () => ({}) }
  },
  { _id: false }
);

const referencesSchema = new Schema(
  {
    textBooks: {
      type: [String],
      default: []
    },

    referenceBooks: {
      type: [String],
      default: []
    },

    journals: {
      type: [String],
      default: []
    },

    webResources: {
      type: [String],
      default: []
    },

    // 🔥 NEW
    moocCourses: [
      {
        platform: { type: String, trim: true, default: '' },
        courseName: { type: String, trim: true, default: '' },
        _id: false
      }
    ],

    // 🔥 NEW
    projects: {
      type: [String],
      default: []
    },

    // 🔥 NEW
    termWork: {
      enabled: {
        type: Boolean,
        default: false
      },
      activity: {
        type: String,
        default: ''
      }
    },

    // 🔥 NEW
    gapIdentification: {
      enabled: {
        type: Boolean,
        default: false
      },
      entry: {
        type: String,
        default: ''
      }
    }
  },
  { _id: false }
);

/* =========================
   MAIN SCHEMA
========================= */

const coursePlanSchema = new Schema(
  {
    sectionId: { type: String, required: true, trim: true },
    subjectId: { type: String, required: true, trim: true },

    // metadata
    academicYear: String,
    courseCode: String,
    courseTitle: String,

    semester: Number,
    year: Number,

    // course department
    program: String,

    // faculty reference
    facultyId: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    facultyName: { type: String, default: '' },
    facultyDesignation: { type: String, default: '' },
    facultyDepartment: { type: String, default: '' },
    courseDetails: { type: courseDetailsSchema, default: {} },
    coPoMapping: { type: coPoMappingSchema, default: {} },
    references: { type: referencesSchema, default: {} }
  },
  { timestamps: true }
);

coursePlanSchema.index({ sectionId: 1, subjectId: 1 }, { unique: true });

const CoursePlan =
  mongoose.models.CoursePlan || mongoose.model('CoursePlan', coursePlanSchema);

export default CoursePlan;
