import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
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
    },
    instruction: {
      type: String,
      default: "",
    },
    attachments: [String],

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

export default mongoose.model("Material", materialSchema);
