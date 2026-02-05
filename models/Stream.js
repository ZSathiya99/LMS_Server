import mongoose from "mongoose";

const StreamSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    attachments: {
      type: [String],
      default: [],
    },

    // 🔥 ADD THESE
    link: {
      type: String,
      default: "",
    },
    youtubeLink: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);


export default mongoose.model("Stream", streamSchema);
