import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Faculty from "../models/Faculty.js";

dotenv.config();

const migrateFacultyId = async () => {
  try {
    console.log("🔄 Migration started...");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const users = await User.find({ role: "faculty" });

    console.log(`👥 Faculty users found: ${users.length}`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      const faculty = await Faculty.findOne({ email: user.email });

      if (!faculty) {
        console.log(`⚠️ Faculty NOT found for: ${user.email}`);
        skipped++;
        continue;
      }

      if (user.facultyId) {
        console.log(`⏭ Already linked: ${user.email}`);
        skipped++;
        continue;
      }

      user.facultyId = faculty._id;
      await user.save();

      console.log(`✅ Linked: ${user.email} → ${faculty._id}`);
      updated++;
    }

    console.log("🎉 Migration completed!");
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);

    process.exit();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrateFacultyId();
