// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: [
        "admin",
        "faculty",
        "student",
        "HOD",
        "Dean",
        "Professor",
        "Assistant Professor",
        "Associate Professor"
      ],
      default: "faculty",   // or set to "student" for student creation
    },

    resetOtp: String,
    resetOtpExpiry: Date,
  },
  { timestamps: true }
);

// Hash password before saving (only when modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plaintext password with hashed one
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
