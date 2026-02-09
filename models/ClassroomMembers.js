import mongoose from 'mongoose';

const ClassroomMemberSchema = new mongoose.Schema(
  {
    classId: {
      type: String,
      required: true,
      index: true
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'userModel'
    },

    role: {
      type: String,
      enum: ['student', 'faculty'],
      required: true
    },

    joinMethod: {
      type: String,
      enum: ['self', 'invite'],
      required: true
    }
  },
  { timestamps: true }
);

ClassroomMemberSchema.index({ classId: 1, userId: 1 }, { unique: true });

export default mongoose.model('ClassroomMember', ClassroomMemberSchema);
