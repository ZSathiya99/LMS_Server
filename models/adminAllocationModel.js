import mongoose from "mongoose";

// Staff sub-schema (no _id)
const StaffSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    email: String,
    profileImg: String,
  },
  { _id: false }
);

// Sections (must have _id)
const SectionSchema = new mongoose.Schema(
  {
    sectionName: String,

    // 🔥 ADD THIS
    classroomCode: {
      type: String,
      unique: true,   // optional but recommended
      sparse: true    // prevents unique error if null
    },

    staff: { type: StaffSchema, default: {} }
  },
  { _id: true }
);

// Subjects
const SubjectSchema = new mongoose.Schema({
  code: String,
  subject: String,
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'Subject',
    required: true
  },
  sections: [SectionSchema]
});

const AdminAllocationSchema = new mongoose.Schema({
  department: String,
  semester: Number,
  semesterType: String,
  subjectType: String,
  regulation: String,
  subjects: [SubjectSchema]
});

export default mongoose.model("AdminAllocation", AdminAllocationSchema);

