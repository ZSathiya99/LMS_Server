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

// Sections
const SectionSchema = new mongoose.Schema(
  {
    sectionName: String,
    staff: { type: StaffSchema, default: {} }
  },
  { _id: true }   // <-- IMPORTANT (GENERATE section _id)
);

// Subjects
const SubjectSchema = new mongoose.Schema({
  code: String,
  subject: String,
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
