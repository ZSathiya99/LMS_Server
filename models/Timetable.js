import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema({
  time: { type: String, required: true }, // "08:40AM - 09:30AM"

  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },

  subjectName: { type: String, required: true },

  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
  },

  facultyName: { type: String, required: true },
});

const DaySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    required: true,
  },
  slots: [SlotSchema],
});

const TimetableSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    year: { type: String, required: true }, // "1st Year"
    section: { type: String, required: true }, // "Section A"
    semester: { type: Number, required: true },   

    days: [DaySchema],
  },
  { timestamps: true }
);

export default mongoose.model("Timetable", TimetableSchema);
