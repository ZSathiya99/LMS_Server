import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  designation: { type: String },
  department: { type: String },
  email: { type: String },
  phone: { type: String, required: true },
});

const Faculty = mongoose.model("Faculty", facultySchema);
export default Faculty;
