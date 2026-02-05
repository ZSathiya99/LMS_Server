import mongoose from "mongoose";
import Assignment from "../models/Assignment.js";

/* =====================================================
   CREATE ASSIGNMENT
===================================================== */
export const createAssignment = async (req, res) => {
  try {
    const {
      subjectId,
      title,
      instruction,
      attachments,
      link,
      youtubeLink,
      dueDate,
    } = req.body;

    const staffId = req.user.facultyId;

    // Validation
    if (!subjectId || !title || !dueDate) {
      return res.status(400).json({
        message: "Subject ID, title and due date are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid Subject ID" });
    }

    const newAssignment = await Assignment.create({
      subjectId,
      staffId,
      title,
      instruction: instruction || "",
      attachments: attachments || [],
      link: link || "",
      youtubeLink: youtubeLink || "",
      dueDate,
    });

    return res.status(201).json({
      message: "Assignment created successfully",
      data: newAssignment,
    });
  } catch (error) {
    console.error("Create Assignment Error:", error);
    return res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   GET ALL ASSIGNMENTS BY SUBJECT
===================================================== */
export const getAssignmentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid Subject ID" });
    }

    const assignments = await Assignment.find({
      subjectId,
      staffId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      total: assignments.length,
      data: assignments,
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
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid Assignment ID" });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      staffId,
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    console.error("Get Single Assignment Error:", error);
    return res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   UPDATE ASSIGNMENT
===================================================== */
export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid Assignment ID" });
    }

    const updatedAssignment = await Assignment.findOneAndUpdate(
      { _id: assignmentId, staffId },
      req.body,
      { new: true }
    );

    if (!updatedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.status(200).json({
      message: "Assignment updated successfully",
      data: updatedAssignment,
    });
  } catch (error) {
    console.error("Update Assignment Error:", error);
    return res.status(500).json({ message: error.message });
  }
};


/* =====================================================
   DELETE ASSIGNMENT
===================================================== */
export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: "Invalid Assignment ID" });
    }

    const deletedAssignment = await Assignment.findOneAndDelete({
      _id: assignmentId,
      staffId,
    });

    if (!deletedAssignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.status(200).json({
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Assignment Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
