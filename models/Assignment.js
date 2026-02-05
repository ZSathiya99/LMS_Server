import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    instruction: {
      type: String,
      default: "",
    },
    attachments: {
      type: [String],
      default: [],
    },
    link: {
      type: String,
      default: "",
    },
    youtubeLink: {
      type: String,
      default: "",
    },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", AssignmentSchema);
