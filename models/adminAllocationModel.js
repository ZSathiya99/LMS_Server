import mongoose from "mongoose";

const adminAllocationSchema = new mongoose.Schema({
  department: String,
  admin: {
    profileImg: String,
    firstName: String,
    lastName: String,
    salutation: String,
    email: String,
    department: String,
  },
  semester: Number,
  semesterType: String,
  subjectType: String,
  regulation: String,
  subjects: [
    {
      code: String,
      subject: String,
    },
  ],
});

export default mongoose.model("AdminAllocation", adminAllocationSchema);
