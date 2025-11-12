import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true },
  subject: { type: String, required: true },
  department: { type: String, required: true },
  faculty: {  // 👈 Add this line
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
  },
});

export default mongoose.model("Subject", subjectSchema);
