import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema({
  salutation: String,
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: String,
  dateOfBirth: Date,
  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true },
  qualification: String,
  workType: String,
  employeeId: { type: String, required: true, unique: true },
  joiningDate: Date,
  jobTitle: String,
  designation: String,
  reportingManager: String,
  department: String,
  noticePeriod: String,
  // user: String,
  documents: {
    markSheet: String,
    experienceCertificate: String,
    degreeCertificate: String,
  },
});


const Faculty = mongoose.model("Faculty", FacultySchema);
export default Faculty;
