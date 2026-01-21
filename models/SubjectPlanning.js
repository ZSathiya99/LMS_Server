import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
  sno: Number,
  topicName: String,
  teachingLanguage: String,
  date: String,
  hours: String,
  teachingAid: String,
  referenceBook: String,
});

const unitSchema = new mongoose.Schema({
  unitName: String, // Unit 1, Unit 2, Others
  topics: [topicSchema],
});

const subjectPlanningSchema = new mongoose.Schema({
  staffId: String,
  subjectId: String,
  subjectCode: String,
  subjectName: String,
  department: String,
  semester: Number,
  semesterType: String,
  regulation: String,
  units: [unitSchema],
});

export default mongoose.model("SubjectPlanning", subjectPlanningSchema);
