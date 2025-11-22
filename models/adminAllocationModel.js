import mongoose from "mongoose";

const AdminAllocationSchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  semesterType: { type: String, required: true },
  subjectType: { type: String, required: true },
  regulation: { type: String, required: true },

  subjects: [
    {
      code: String,
      subject: String,

      sections: [
        {
          sectionName: String,
          staff: {
            id: String,          // ← matches assignStaffToSection
            name: String,
            email: String,
            profileImg: String   // ← your POST code includes this
          }
        }
      ]
    }
  ]
});

export default mongoose.model("AdminAllocation", AdminAllocationSchema);
