import Stream from "../models/Stream.js";
import mongoose from "mongoose";
import AdminAllocation from "../models/adminAllocationModel.js";
import fs from "fs";
import path from "path";

/* =========================================
   🔥 CREATE STREAM POST
========================================= */
export const createStreamPost = async (req, res) => {
  try {
    const { subjectId, message, link, youtubeLink } = req.body;
    const staffId = req.user.facultyId;

    if (!subjectId || !message) {
      return res.status(400).json({
        message: "Subject ID and message are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid Subject ID" });
    }

    // Convert files to full URL
    const uploadedFiles =
      req.files?.map(
        (file) =>
          `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      ) || [];

    const newPost = await Stream.create({
      subjectId,
      staffId,
      message,
      attachments: uploadedFiles,
      link: link || "",
      youtubeLink: youtubeLink || "",
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

/* =========================================
   🔥 GET STREAM BY SUBJECT
========================================= */

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

    // 🔥 Proper nested matching using $elemMatch
    const allocation = await AdminAllocation.findOne({
      subjects: {
        $elemMatch: {
          _id: subjectId,
          sections: {
            $elemMatch: {
              "staff.id": String(staffId),
            },
          },
        },
      },
    });

    if (!allocation) {
      return res.status(404).json({ message: "Subject not found" });
    }

    let subjectData = null;

    allocation.subjects.forEach((subject) => {
      if (String(subject._id) === String(subjectId)) {
        subject.sections.forEach((section) => {
          if (String(section.staff?.id) === String(staffId)) {
            subjectData = {
              subjectId: subject._id,
              department: allocation.department,
              regulation: allocation.regulation,
              semester: allocation.semester,
              semesterType: allocation.semesterType,
              subjectCode: subject.code,
              subjectName: subject.subject,
              sectionName: section.sectionName,
              classroomCode: section.classroomCode,
            };
          }
        });
      }
    });

    if (!subjectData) {
      return res.status(404).json({
        message: "Subject details not found",
      });
    }

    const streamPosts = await Stream.find({
      subjectId,
      staffId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      ...subjectData,
      totalPosts: streamPosts.length,
      stream: streamPosts,
    });

  } catch (error) {
    console.error("Get Stream Error:", error);
    return res.status(500).json({ message: error.message });
  }
};






/* =========================================
   🔥 UPDATE STREAM POST
========================================= */
export const updateStreamPost = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { message, link, youtubeLink } = req.body;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({ message: "Invalid Stream ID" });
    }

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
    if (link !== undefined) post.link = link;
    if (youtubeLink !== undefined) post.youtubeLink = youtubeLink;

    // Add new uploaded files
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map(
        (file) =>
          `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      );

      post.attachments = [...post.attachments, ...newFiles];
    }

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

/* =========================================
   🔥 DELETE STREAM POST
========================================= */
export const deleteStreamPost = async (req, res) => {
  try {
    const { streamId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({ message: "Invalid Stream ID" });
    }

    const deletedPost = await Stream.findOneAndDelete({
      _id: streamId,
      staffId,
    });

    if (!deletedPost) {
      return res.status(404).json({
        message: "Post not found or unauthorized",
      });
    }

    // Delete uploaded files from server
    if (deletedPost.attachments?.length > 0) {
      deletedPost.attachments.forEach((fileUrl) => {
        const filename = fileUrl.split("/uploads/")[1];
        const filePath = path.join("uploads", filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
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
