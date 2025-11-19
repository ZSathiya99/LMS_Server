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
const AdminAllocationSchema = new mongoose.Schema({
  semester: Number,
  semesterType: String,
  subjectType: String,
  regulation: Number,
  department: String,

  subjects: [
    {
      subject: String,
      sections: [
        {
          sectionName: String,
          staff: {
            name: String,
            email: String,
            facultyId: String
          }
        }
      ]
    }
  ]
});


export default mongoose.model("AdminAllocation", adminAllocationSchema);
