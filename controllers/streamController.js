import Stream from "../models/Stream.js";
import mongoose from "mongoose";
import AdminAllocation from "../models/AdminAllocationModel.js";
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

    // 🔥 Find allocation using projection (faster)
    const allocation = await AdminAllocation.findOne(
      {
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
      },
      {
        department: 1,
        regulation: 1,
        semester: 1,
        semesterType: 1,
        subjects: 1,
      }
    );

    if (!allocation) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // 🔥 Find subject + section directly
    const subject = allocation.subjects.find(
      (sub) => String(sub._id) === String(subjectId)
    );

    if (!subject) {
      return res.status(404).json({
        message: "Subject details not found",
      });
    }

    const section = subject.sections.find(
      (sec) => String(sec.staff?.id) === String(staffId)
    );

    if (!section) {
      return res.status(404).json({
        message: "Section not found for this staff",
      });
    }

    const subjectData = {
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

    // 🔥 Get Stream Posts + sort comments inside each stream
    const streamPosts = await Stream.find({
      subjectId,
      staffId,
    })
      .sort({ createdAt: -1 })
      .lean(); // faster response

    // 🔥 Sort comments inside each stream (newest first)
    streamPosts.forEach((post) => {
      if (post.comments?.length > 0) {
        post.comments.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
    });

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
export const addCommentToStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { comment } = req.body;

    let role = req.user.role;

    if (role === "faculty") {
      role = "staff";
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({ message: "Stream not found" });
    }

    stream.comments.push({
      userId: req.user.id,
      role,
      name: req.user.name,
      profileImg: req.user.profileImg || "",
      comment,
    });

    await stream.save();

    return res.status(200).json({
      message: "Comment added successfully",
      data: stream.comments,
    });

  } catch (error) {
    console.error("Add Comment Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteCommentFromStream = async (req, res) => {
  try {
    const { streamId, commentId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(streamId) ||
        !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({ message: "Stream not found" });
    }

    const comment = stream.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // 🔥 Permission check
    if (role === "student" && String(comment.userId) !== String(userId)) {
      return res.status(403).json({
        message: "You can only delete your own comment",
      });
    }

    // Staff can delete any comment
    comment.deleteOne();

    await stream.save();

    return res.status(200).json({
      message: "Comment deleted successfully",
    });

  } catch (error) {
    console.error("Delete Comment Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
