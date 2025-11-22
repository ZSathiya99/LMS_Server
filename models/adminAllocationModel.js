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
    sectionName: { type: String, required: true },
    staff: {
      id: { type: String, default: null },
      name: { type: String, default: null },
      email: { type: String, default: null },
      profileImg: { type: String, default: null }
    }
  }
]

    },
  ],
});


export default mongoose.model("AdminAllocation", AdminAllocationSchema);
