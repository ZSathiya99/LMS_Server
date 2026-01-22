import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    salutation: String,

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    gender: String,
    dateOfBirth: Date,

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
    },

    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    department: {
      type: String,
      required: true,
    },

    // Academic Position (NOT system role)
    designation: {
      type: String,
      enum: [
        "Professor",
        "Assistant Professor",
        "Associate Professor",
        "HOD",
        "Dean",
      ],
      required: true,
    },

    qualification: String,
    workType: String,
    joiningDate: Date,
    reportingManager: String,
    noticePeriod: String,

    documents: {
      markSheet: String,
      experienceCertificate: String,
      degreeCertificate: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Faculty", FacultySchema);
