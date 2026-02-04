import Stream from "../models/Stream.js";
import mongoose from "mongoose";
import AdminAllocation from "../models/adminAllocationModel.js"

// ==============================
// 🔥 CREATE STREAM POST
// ==============================
export const createStreamPost = async (req, res) => {
  try {
    const { subjectId, message, attachments } = req.body;
    const staffId = req.user.facultyId;

    if (!subjectId || !message) {
      return res.status(400).json({
        message: "Subject ID and message are required",
      });
    }

    const newPost = await Stream.create({
      subjectId,
      staffId,
      message,
      attachments: attachments || [],
    });

    return res.status(201).json({
      message: "Announcement created successfully",
      data: newPost,
    });
  } catch (error) {
    console.error("Create Stream Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ==============================
// 🔥 GET STREAM BY SUBJECT
// ==============================

// helper
const getAcademicYear = (semester) => {
  if (semester <= 2) return "1st Year";
  if (semester <= 4) return "2nd Year";
  if (semester <= 6) return "3rd Year";
  if (semester <= 8) return "4th Year";
  return "Unknown";
};

export const getStreamBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid Subject ID" });
    }

    // 🔥 1️⃣ Get Subject Details from Allocation
    const allocation = await AdminAllocation.findOne({
      "subjects._id": subjectId,
      "subjects.sections.staff.id": staffId.toString(),
    });

    if (!allocation) {
      return res.status(404).json({ message: "Subject not found" });
    }

    let subjectData = null;

    allocation.subjects.forEach((subject) => {
      if (subject._id.toString() === subjectId) {
        subject.sections.forEach((section) => {
          if (section.staff?.id?.toString() === staffId.toString()) {
            subjectData = {
              subjectId: subject._id,
              department: allocation.department,
              regulation: allocation.regulation,
              semester: allocation.semester,
              semesterType: allocation.semesterType,
              year: getAcademicYear(allocation.semester),
              subjectCode: subject.code,
              subjectName: subject.subject,
              sectionName: section.sectionName,
            };
          }
        });
      }
    });

    if (!subjectData) {
      return res.status(404).json({ message: "Subject details not found" });
    }

    // 🔥 2️⃣ Random Image
    const images = [
      "/images/banner1.png",
      "/images/banner2.png",
      "/images/banner3.png",
      "/images/banner4.png",
      "/images/banner5.png",
    ];

    const randomImage = images[Math.floor(Math.random() * images.length)];

    // 🔥 3️⃣ Generate Class Code
    const classCode =
      subjectData.subjectCode +
      "-" +
      Math.random().toString(36).substring(2, 7).toUpperCase();

    // 🔥 4️⃣ Get Stream Posts
    const streamPosts = await Stream.find({
      subjectId,
      staffId,
    }).sort({ createdAt: -1 });

    // 🔥 5️⃣ Final Response
    return res.status(200).json({
      ...subjectData,
      image: randomImage,
      classCode,
      totalPosts: streamPosts.length,
      stream: streamPosts,
    });
  } catch (error) {
    console.error("Get Stream Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ==============================
// 🔥 UPDATE STREAM POST
// ==============================
export const updateStreamPost = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { message, attachments } = req.body;
    const staffId = req.user.facultyId;

    const post = await Stream.findOne({
      _id: streamId,
      staffId,
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found or unauthorized",
      });
    }

    if (message) post.message = message;
    if (attachments) post.attachments = attachments;

    await post.save();

    return res.status(200).json({
      message: "Post updated successfully",
      data: post,
    });
  } catch (error) {
    console.error("Update Stream Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ==============================
// 🔥 DELETE STREAM POST
// ==============================
export const deleteStreamPost = async (req, res) => {
  try {
    const { streamId } = req.params;
    const staffId = req.user.facultyId;

    const deletedPost = await Stream.findOneAndDelete({
      _id: streamId,
      staffId,
    });

    if (!deletedPost) {
      return res.status(404).json({
        message: "Post not found or unauthorized",
      });
    }

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete Stream Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
