import Stream from '../models/Stream.js';
import mongoose from 'mongoose';
import AdminAllocation from '../models/adminAllocationModel.js';
import Student from "../models/Student.js";
import ClassroomMember from "../models/ClassroomMembers.js";
import fs from 'fs';
import path from 'path';

/* =========================================
   🔥 CREATE STREAM POST
========================================= */
export const createStreamPost = async (req, res) => {
  try {
    const { subjectId, sectionId, message, link, youtubeLink } = req.body;
    const staffId = req.user.facultyId;

    if (!subjectId || !sectionId || !message) {
      return res.status(400).json({
        message: 'subjectId, sectionId and message are required'
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({ message: 'Invalid ID provided' });
    }

    const uploadedFiles =
      req.files?.map(
        (file) =>
          `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      ) || [];

    const newPost = await Stream.create({
      subjectId,
      sectionId, // 🔥 added
      staffId,
      message,
      attachments: uploadedFiles,
      link: link || '',
      youtubeLink: youtubeLink || ''
    });

    return res.status(201).json({
      message: 'Announcement created successfully',
      data: newPost
    });
  } catch (error) {
    console.error('Create Stream Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================
   🔥 GET STREAM BY SUBJECT
========================================= */

const getAcademicYear = (semester) => {
  if (semester <= 2) return '1st Year';
  if (semester <= 4) return '2nd Year';
  if (semester <= 6) return '3rd Year';
  if (semester <= 8) return '4th Year';
  return 'Unknown';
};

export const getStreamBySubject = async (req, res) => {
  try {
    const { subjectId, sectionId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    let allocation;

    // ================================
    // 🔥 ROLE BASED ALLOCATION CHECK
    // ================================
    if (req.user.role === "faculty" || req.user.role === "HOD") {

      const staffId = req.user.facultyId;

      allocation = await AdminAllocation.findOne({
        subjects: {
          $elemMatch: {
            subjectId,
            sections: {
              $elemMatch: {
                _id: sectionId,
                "staff.id": String(staffId)
              }
            }
          }
        }
      });

    } else if (req.user.role === "student") {

      // 🔥 Student should only access their section
      if (String(req.user.sectionId) !== String(sectionId)) {
        return res.status(403).json({
          message: "Access denied for this section"
        });
      }

      allocation = await AdminAllocation.findOne({
        subjects: {
          $elemMatch: {
            subjectId,
            sections: {
              $elemMatch: {
                _id: sectionId
              }
            }
          }
        }
      });

    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    if (!allocation) {
      return res.status(404).json({
        message: 'Subject or section not found'
      });
    }

    // ================================
    // 🔥 FIND SUBJECT & SECTION
    // ================================
    const subject = allocation.subjects.find(
      (sub) => String(sub.subjectId) === String(subjectId)
    );

    if (!subject) {
      return res.status(404).json({
        message: 'Subject details not found'
      });
    }

    const section = subject.sections.find(
      (sec) => String(sec._id) === String(sectionId)
    );

    if (!section) {
      return res.status(404).json({
        message: 'Section not found'
      });
    }

    const subjectData = {
      subjectId: subject.subjectId,
      sectionId: section._id,
      department: allocation.department,
      regulation: allocation.regulation,
      semester: allocation.semester,
      semesterType: allocation.semesterType,
      subjectCode: subject.code,
      subjectName: subject.subject,
      sectionName: section.sectionName,
      classroomCode: section.classroomCode
    };

    // ================================
    // 🔥 STREAM FILTER
    // ================================
    let filter = {
      subjectId,
      sectionId
    };

    // Staff → only their posts
    if (req.user.role === "faculty" || req.user.role === "HOD") {
      filter.staffId = req.user.facultyId;
    }

    // Student → no staff filter

    const streamPosts = await Stream.find(filter)
      .sort({ createdAt: -1 })
      .lean();

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
      stream: streamPosts
    });

  } catch (error) {
    console.error('Get Stream Error:', error);
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
      return res.status(400).json({ message: 'Invalid Stream ID' });
    }

    const post = await Stream.findOne({
      _id: streamId,
      staffId
    });

    if (!post) {
      return res.status(404).json({
        message: 'Post not found or unauthorized'
      });
    }

    if (message) post.message = message;
    if (link !== undefined) post.link = link;
    if (youtubeLink !== undefined) post.youtubeLink = youtubeLink;

    if (req.files?.length > 0) {
      const newFiles = req.files.map(
        (file) =>
          `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      );

      post.attachments = [...post.attachments, ...newFiles];
    }

    await post.save();

    return res.status(200).json({
      message: 'Post updated successfully',
      data: post
    });
  } catch (error) {
    console.error('Update Stream Error:', error);
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
      return res.status(400).json({ message: 'Invalid Stream ID' });
    }

    const deletedPost = await Stream.findOneAndDelete({
      _id: streamId,
      staffId
    });

    if (!deletedPost) {
      return res.status(404).json({
        message: 'Post not found or unauthorized'
      });
    }

    // Delete uploaded files from server
    if (deletedPost.attachments?.length > 0) {
      deletedPost.attachments.forEach((fileUrl) => {
        const filename = fileUrl.split('/uploads/')[1];
        const filePath = path.join('uploads', filename);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    return res.status(200).json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete Stream Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const addCommentToStream = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { comment } = req.body;

    let role = req.user.role;

    if (role === 'faculty') {
      role = 'staff';
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    stream.comments.push({
      userId: req.user.id,
      role,
      name: req.user.name,
      profileImg: req.user.profileImg || '',
      comment
    });

    await stream.save();

    return res.status(200).json({
      message: 'Comment added successfully',
      data: stream.comments
    });
  } catch (error) {
    console.error('Add Comment Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const deleteCommentFromStream = async (req, res) => {
  try {
    const { streamId, commentId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    if (
      !mongoose.Types.ObjectId.isValid(streamId) ||
      !mongoose.Types.ObjectId.isValid(commentId)
    ) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const stream = await Stream.findById(streamId);

    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    const comment = stream.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // 🔥 Permission check
    if (role === 'student' && String(comment.userId) !== String(userId)) {
      return res.status(403).json({
        message: 'You can only delete your own comment'
      });
    }

    // Staff can delete any comment
    comment.deleteOne();

    await stream.save();

    return res.status(200).json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete Comment Error:', error);
    return res.status(500).json({ message: error.message });
  }
};
//FINAL GET API (Student Stream)
export const getStudentStream = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userRole = req.user.role;

    // 1️⃣ Only student
    if (userRole !== "student") {
      return res.status(403).json({
        message: "Access denied. Only students allowed",
      });
    }

    // 2️⃣ Get student
    const student = await Student.findOne({ email: userEmail }).lean();

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // 3️⃣ Get all joined classrooms
    const memberships = await ClassroomMember.find({
      userId: student._id,
      role: "student",
    }).lean();

    if (!memberships.length) {
      return res.status(404).json({
        message: "No classrooms joined",
      });
    }

    const sectionIds = memberships.map((m) => m.sectionId);

    // 4️⃣ Get stream posts for those sections
    const streams = await Stream.find({
      sectionId: { $in: sectionIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    // 5️⃣ Attach subject + staff info
    const results = [];

    for (const post of streams) {
      const allocation = await AdminAllocation.findOne({
        "subjects.sections._id": post.sectionId,
      }).lean();

      if (!allocation) continue;

      for (const sub of allocation.subjects) {
        const section = sub.sections.find(
          (s) => s._id.toString() === post.sectionId.toString()
        );

        if (section) {
          results.push({
            _id: post._id,
            message: post.message,
            attachments: post.attachments,
            link: post.link,
            youtubeLink: post.youtubeLink,
            createdAt: post.createdAt,

            subject: sub.subject,
            section: section.sectionName,

            // ✅ staff from your existing object
            staffName: section.staff?.name || "",
          });

          break;
        }
      }
    }

    res.json({
      totalPosts: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Student Stream Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};