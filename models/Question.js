import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Subject",
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Faculty",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    questionType: {
      type: String,
      required: true,
      enum: ["MCQ", "Descriptive", "True/False", "Short Answer"],
    },
    instruction: {
      type: String,
      default: "",
    },
    attachments: [
      {
        type: String, // store file URL or file name
      },
    ],
    dueDate: {
      type: Date,
    },
    assignTo: {
      type: String,
      default: "All Students",
    },
    link: {
      type: String,
      default: "",
    },

    youtubeLink: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Question", questionSchema);
