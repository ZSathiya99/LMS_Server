import mongoose from 'mongoose';

const ClassroomSchema = new mongoose.Schema(
  {
    enorollmentCode: {
      type: String,
      required: true
    },
    joinEnabled: {
      type: Boolean,
      required: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    className: {
      type: String,
      required: true,
      trim: true
    },
    section: {
      type: String,
      required: true,
      trim: true
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    year: {
      type: String, // or Number (eg: 1,2,3,4)
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Classroom', ClassroomSchema);
