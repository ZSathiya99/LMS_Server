import mongoose from "mongoose";

const AdminAllocationSchema = new mongoose.Schema({
  department: String,
  semester: Number,
  semesterType: String,
  subjectType: String,
  regulation: String,

  subjects: [
    {
      code: String,
      subject: String,
      sections: [
        {
          sectionName: String,
          staff: {
            id: String,
            name: String,
            email: String,
            profileImg: String
          }
        }
      ]
    }
  ]
});

export default mongoose.model("AdminAllocation", AdminAllocationSchema);
