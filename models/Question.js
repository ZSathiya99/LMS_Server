import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
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
    },
    questionType: {
      type: String,
      enum: ["Single Choice", "Multiple Choice"],
      required: true,
    },
    instruction: String,
    attachments: [String],
    marks: {
      type: Number,
      required: true,
    },

    // ✅ OPTIONS FIELD
    options: [
      {
        text: {
          type: String,
        },
      },
    ],

    link: String,
    youtubeLink: String,
    dueDate: Date,
  },
  { timestamps: true },
);

export default mongoose.model("Question", questionSchema);
