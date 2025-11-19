// models/Faculty.js
import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema({
  salutation: String,
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: String,
  dateOfBirth: Date,

  email: { type: String, required: true, unique: true },
  mobileNumber: { type: String, required: true },

  password: { type: String, required: true }, // hashed

  qualification: String,
  workType: String,
  employeeId: { type: String, required: true, unique: true },
  joiningDate: Date,
  jobTitle: String,
  designation: String,
  reportingManager: String,
  department: String,
  noticePeriod: String,

  role: {
    type: String,
    enum: [
      "faculty",
      "HOD",
      "Dean",
      "Professor",
      "Assistant Professor",
      "Associate Professor",
      "admin"
    ],
    default: "faculty",
  },

  documents: {
    markSheet: String,
    experienceCertificate: String,
    degreeCertificate: String,
  },
}, { timestamps: true });

export default mongoose.model("Faculty", FacultySchema);
