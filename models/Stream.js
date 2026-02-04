import mongoose from "mongoose";

const streamSchema = new mongoose.Schema(
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
    message: {
      type: String,
      required: true,
    },
    attachments: [
      {
        type: String, // store file URL or link
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Stream", streamSchema);
