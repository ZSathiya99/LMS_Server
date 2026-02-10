import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";
import ClassroomMembers from "../models/ClassroomMembers.js";

/* =====================================================
   CREATE ASSIGNMENT
===================================================== */
export const createAssignment = async (req, res) => {
  try {
    const {
      subjectId,
      title,
      instruction,
      link,
      youtubeLink,
      dueDate,
      marks,
    } = req.body;

    const staffId = req.user.facultyId;

    if (!subjectId || !title || !dueDate || !marks) {
      return res.status(400).json({
        message: "Subject ID, title, due date and marks are required",
      });
    }

    if (Number(marks) <= 0) {
      return res.status(400).json({
        message: "Marks must be greater than 0",
      });
    }

    const uploadedFiles =
      req.files?.map(
        (file) =>
          `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      ) || [];

    const assignment = await Assignment.create({
      subjectId,
      staffId,
      title,
      instruction: instruction || "",
      attachments: uploadedFiles,
      link: link || "",
      youtubeLink: youtubeLink || "",
      dueDate,
      marks: Number(marks),
      comments: [],
      submissions: [],
    });

    return res.status(201).json({
      message: "Assignment created successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Create Assignment Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET ASSIGNMENTS BY SUBJECT (WITH STATS)
===================================================== */
export const getAssignmentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid Subject ID" });
    }

    // 1️⃣ Classroom students
    const classroomStudents = await ClassroomMembers.find({
      subjectId,
    }).populate(
      "studentId",
      "firstName lastName registerNumber email profileImg"
    );

    const totalStudents = classroomStudents.length;

    // 2️⃣ Assignments
    const assignments = await Assignment.find({ subjectId })
      .sort({ createdAt: -1 });

    // 3️⃣ Build response
    const result = assignments.map((assignment) => {
      const submittedIds = assignment.submissions.map((s) =>
        s.studentId.toString()
      );

      const submittedStudents = classroomStudents
        .filter((stu) =>
          submittedIds.includes(stu.studentId._id.toString())
        )
        .map((stu) => {
          const submission = assignment.submissions.find(
            (s) =>
              s.studentId.toString() ===
              stu.studentId._id.toString()
          );

          return {
            ...stu.studentId.toObject(),
            submittedAt: submission?.submittedAt,
            marksObtained: submission?.marksObtained,
            attachment: submission?.attachment,
          };
        });

      const pendingStudents = classroomStudents
        .filter(
          (stu) =>
            !submittedIds.includes(
              stu.studentId._id.toString()
            )
        )
        .map((stu) => stu.studentId);

      return {
        ...assignment.toObject(),

        stats: {
          totalStudents,
          submitted: submittedStudents.length,
          pending: pendingStudents.length,
          comments: assignment.comments.length,
        },

        students: {
          all: classroomStudents.map((stu) => stu.studentId),
          submitted: submittedStudents,
          pending: pendingStudents,
        },
      };
    });

    return res.status(200).json({
      totalAssignments: result.length,
      assignments: result,
    });
  } catch (error) {
    console.error("Get Assignments Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SINGLE ASSIGNMENT
===================================================== */
export const getSingleAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid Assignment ID" });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE ASSIGNMENT
===================================================== */
export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid Assignment ID" });
    }

    const updated = await Assignment.findByIdAndUpdate(
      assignmentId,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.status(200).json({
      message: "Assignment updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   DELETE ASSIGNMENT
===================================================== */
export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid Assignment ID" });
    }

    const deleted = await Assignment.findByIdAndDelete(
      assignmentId
    );

    if (!deleted) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.status(200).json({
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   ADD COMMENT (STAFF / STUDENT)
===================================================== */
export const addAssignmentComment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: "Comment required" });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    assignment.comments.push({
      userId:
        req.user.role === "faculty"
          ? req.user.facultyId
          : req.user.studentId,
      userType:
        req.user.role === "faculty" ? "staff" : "student",
      comment,
    });

    await assignment.save();

    return res.status(201).json({
      message: "Comment added successfully",
      comments: assignment.comments,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   STUDENT SUBMIT ASSIGNMENT
===================================================== */
export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const studentId = req.user.studentId;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const file = req.file
      ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
      : null;

    const existing = assignment.submissions.find(
      (s) => s.studentId.toString() === studentId.toString()
    );

    if (existing) {
      existing.attachment = file;
      existing.submittedAt = new Date();
    } else {
      assignment.submissions.push({
        studentId,
        attachment: file,
        submittedAt: new Date(),
      });
    }

    await assignment.save();

    return res.json({
      message: "Assignment submitted successfully",
      submissions: assignment.submissions,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GRADE SUBMISSION (STAFF)
===================================================== */
export const gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const { marksObtained } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const submission = assignment.submissions.find(
      (s) => s.studentId.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    submission.marksObtained = marksObtained;
    await assignment.save();

    return res.json({
      message: "Marks updated successfully",
      submission,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
