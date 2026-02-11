import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import Question from "../models/Question.js";
import ClassroomMembers from "../models/ClassroomMembers.js";

/* ======================================================
   CREATE QUESTION
====================================================== */
export const createQuestion = async (req, res) => {
  try {
    const staffId = req.user.facultyId;

    const {
      subjectId,
      title,
      questionType,
      instruction,
      dueDate,
      link,
      youtubeLink,
      options,
      marks,
    } = req.body;

    if (!subjectId || !title || !questionType || !marks || !dueDate) {
      return res.status(400).json({
        message:
          "subjectId, title, questionType, marks and dueDate are required",
      });
    }

    if (Number(marks) <= 0) {
      return res.status(400).json({
        message: "Marks must be greater than 0",
      });
    }

    const attachments = req.files
      ? req.files.map((file) => file.filename)
      : [];

    let formattedOptions = [];

    if (
      questionType === "Single Choice" ||
      questionType === "Multiple Choice"
    ) {
      if (!options) {
        return res.status(400).json({
          message: "Options required for MCQ",
        });
      }

      const parsed =
        typeof options === "string" ? JSON.parse(options) : options;

      formattedOptions = parsed.map((opt) => ({ text: opt }));
    }

    const question = await Question.create({
      subjectId,
      staffId,
      title,
      questionType,
      instruction,
      attachments,
      options: formattedOptions,
      link,
      youtubeLink,
      marks: Number(marks),
      dueDate,
      comments: [],
      submissions: [],
    });

    res.status(201).json({
      message: "Question created successfully",
      data: question,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   GET QUESTIONS BY SUBJECT
====================================================== */
export const getQuestions = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const questions = await Question.find({ subjectId })
      .sort({ createdAt: -1 });

    res.json({
      total: questions.length,
      data: questions,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   GET SINGLE QUESTION
====================================================== */
export const getSingleQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);

    if (!question)
      return res.status(404).json({ message: "Question not found" });

    res.json(question);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   UPDATE QUESTION
====================================================== */
export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const staffId = req.user.facultyId;

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    if (question.staffId.toString() !== staffId.toString())
      return res.status(403).json({ message: "Unauthorized" });

    const {
      title,
      instruction,
      dueDate,
      link,
      youtubeLink,
      options,
      marks,
    } = req.body;

    if (title) question.title = title;
    if (instruction) question.instruction = instruction;
    if (dueDate) question.dueDate = dueDate;
    if (link !== undefined) question.link = link;
    if (youtubeLink !== undefined) question.youtubeLink = youtubeLink;
    if (marks) question.marks = marks;

    if (options) {
      const parsed =
        typeof options === "string" ? JSON.parse(options) : options;

      question.options = parsed.map((opt) => ({ text: opt }));
    }

    if (req.files && req.files.length > 0) {
      question.attachments = req.files.map((file) => file.filename);
    }

    await question.save();

    res.json({
      message: "Question updated successfully",
      data: question,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   DELETE QUESTION
====================================================== */
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const staffId = req.user.facultyId;

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    if (question.staffId.toString() !== staffId.toString())
      return res.status(403).json({ message: "Unauthorized" });

    question.attachments.forEach((file) => {
      const filePath = path.join("uploads", file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Question.findByIdAndDelete(questionId);

    res.json({ message: "Question deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   ADD COMMENT
====================================================== */
export const addQuestionComment = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { comment } = req.body;

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    question.comments.push({
      userId:
        req.user.role === "faculty"
          ? req.user.facultyId
          : req.user.studentId,
      userType:
        req.user.role === "faculty" ? "staff" : "student",
      comment,
    });

    await question.save();

    res.json({
      message: "Comment added successfully",
      comments: question.comments,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   DELETE COMMENT
====================================================== */
export const deleteQuestionComment = async (req, res) => {
  try {
    const { questionId, commentId } = req.params;

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    const comment = question.comments.id(commentId);
    if (!comment)
      return res.status(404).json({ message: "Comment not found" });

    comment.deleteOne();
    await question.save();

    res.json({ message: "Comment deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   STUDENT SUBMIT
====================================================== */
export const submitQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const studentId = req.user.studentId;
    const { selectedOptions } = req.body;

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    const already = question.submissions.find(
      (s) => s.studentId.toString() === studentId.toString()
    );

    if (already)
      return res.status(400).json({ message: "Already submitted" });

    question.submissions.push({
      studentId,
      selectedOptions,
    });

    await question.save();

    res.json({ message: "Submitted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   GET FULL OVERALL DETAILS
====================================================== */
export const getFullQuestionDetails = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId)
      .populate("submissions.studentId", "name registerNumber profileImg");

    if (!question)
      return res.status(404).json({ message: "Question not found" });

    const classroomStudents = await ClassroomMembers.find({
      subjectId: question.subjectId,
    }).populate("studentId", "name registerNumber profileImg");

    const submittedIds = question.submissions.map((s) =>
      s.studentId._id.toString()
    );

    const pending = classroomStudents.filter(
      (stu) =>
        !submittedIds.includes(stu.studentId._id.toString())
    );

    res.json({
      question: {
        key: "Question",     // ✅ Added here
        _id: question._id,
        title: question.title,
        marks: question.marks,
        dueDate: question.dueDate,
        questionType: question.questionType,
        instruction: question.instruction,
        attachments: question.attachments,
        options: question.options,
      },

      comments: {
        staff: question.comments.filter(
          (c) => c.userType === "staff"
        ),
        students: question.comments.filter(
          (c) => c.userType === "student"
        ),
        total: question.comments.length,
      },

      students: {
        total: classroomStudents.length,
        submitted: {
          count: question.submissions.length,
          list: question.submissions,
        },
        pending: {
          count: pending.length,
          list: pending,
        },
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

