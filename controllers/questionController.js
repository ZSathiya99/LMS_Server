import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Question from '../models/Question.js';
import ClassroomMembers from '../models/ClassroomMembers.js';

/* ======================================================
   CREATE QUESTION
====================================================== */
export const createQuestion = async (req, res) => {
  try {
    const staffId = req.user.facultyId;

    const {
      subjectId,
      sectionId, // 🔥 added
      title,
      questionType,
      instruction,
      dueDate,
      link,
      youtubeLink,
      options,
      marks
    } = req.body;

    if (
      !subjectId ||
      !sectionId ||
      !title ||
      !questionType ||
      !marks ||
      !dueDate
    ) {
      return res.status(400).json({
        message:
          'subjectId, sectionId, title, questionType, marks and dueDate are required'
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({
        message: 'Invalid subjectId or sectionId'
      });
    }

    if (Number(marks) <= 0) {
      return res.status(400).json({
        message: 'Marks must be greater than 0'
      });
    }

    const attachments = req.files ? req.files.map((file) => file.filename) : [];

    let formattedOptions = [];

    if (
      questionType === 'Single Choice' ||
      questionType === 'Multiple Choice'
    ) {
      if (!options) {
        return res.status(400).json({
          message: 'Options required for MCQ'
        });
      }

      const parsed =
        typeof options === 'string' ? JSON.parse(options) : options;

      formattedOptions = parsed.map((opt) => ({ text: opt }));
    }

    const question = await Question.create({
      subjectId,
      sectionId, // 🔥 added
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
      submissions: []
    });

    res.status(201).json({
      message: 'Question created successfully',
      data: question
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   GET QUESTIONS (OVERALL DETAILS LIKE ASSIGNMENT)
   Endpoint:
   GET /api/question?subjectId=XXXXX
====================================================== */

export const getQuestionsData = async (req, res) => {
  try {
    const { subjectId, sectionId } = req.query;
    const staffId = req.user.facultyId;

    if (!subjectId || !sectionId) {
      return res.status(400).json({
        message: 'subjectId and sectionId are required'
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({
        message: 'Invalid subjectId or sectionId'
      });
    }

    /* 1️⃣ Get Classroom Students */
    const classroomStudents = await ClassroomMembers.find({
      subjectId,
      sectionId // 🔥 added
    }).populate(
      'studentId',
      'firstName lastName registerNumber email profileImg'
    );

    const totalStudents = classroomStudents.length;

    /* 2️⃣ Get Questions */
    const questions = await Question.find({
      subjectId,
      sectionId, // 🔥 added
      staffId // 🔥 prevent cross staff access
    }).sort({ createdAt: -1 });

    /* 3️⃣ Format Response */
    const formattedQuestions = questions.map((question) => {
      const submittedIds = question.submissions.map((s) =>
        s.studentId.toString()
      );

      const submittedStudents = classroomStudents
        .filter((stu) => submittedIds.includes(stu.studentId._id.toString()))
        .map((stu) => {
          const submission = question.submissions.find(
            (s) => s.studentId.toString() === stu.studentId._id.toString()
          );

          return {
            ...stu.studentId.toObject(),
            submittedAt: submission?.submittedAt || null
          };
        });

      const pendingStudents = classroomStudents
        .filter((stu) => !submittedIds.includes(stu.studentId._id.toString()))
        .map((stu) => stu.studentId);

      return {
        _id: question._id,
        key: 'Question',
        subjectId: question.subjectId,
        sectionId: question.sectionId, // 🔥 added
        title: question.title,
        marks: question.marks,
        dueDate: question.dueDate,
        questionType: question.questionType,
        instruction: question.instruction,
        attachments: question.attachments,
        options: question.options,

        comments: {
          total: question.comments.length,
          staff: question.comments.filter((c) => c.userType === 'staff'),
          students: question.comments.filter((c) => c.userType === 'student')
        },

        stats: {
          totalStudents,
          submitted: submittedStudents.length,
          pending: pendingStudents.length
        },

        students: {
          all: classroomStudents.map((stu) => stu.studentId),
          submitted: submittedStudents,
          pending: pendingStudents
        }
      };
    });

    return res.status(200).json({
      totalQuestions: formattedQuestions.length,
      questions: formattedQuestions
    });
  } catch (error) {
    console.error('Get Questions Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   ADD COMMENT
====================================================== */
export const addQuestionComment = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { comment } = req.body;

    const question = await Question.findOne({
      _id: questionId,
      staffId: req.user.role === 'faculty' ? req.user.facultyId : undefined
    });

    if (!question)
      return res.status(404).json({ message: 'Question not found' });

    question.comments.push({
      userId:
        req.user.role === 'faculty' ? req.user.facultyId : req.user.studentId,
      userType: req.user.role === 'faculty' ? 'staff' : 'student',
      comment
    });

    await question.save();

    res.json({
      message: 'Comment added successfully',
      comments: question.comments
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
      return res.status(404).json({ message: 'Question not found' });

    const comment = question.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.deleteOne();
    await question.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   SUBMIT QUESTION
====================================================== */
export const submitQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const studentId = req.user.studentId;

    const question = await Question.findById(questionId);
    if (!question)
      return res.status(404).json({ message: 'Question not found' });

    const already = question.submissions.find(
      (s) => s.studentId.toString() === studentId.toString()
    );

    if (already) return res.status(400).json({ message: 'Already submitted' });

    question.submissions.push({
      studentId,
      submittedAt: new Date()
    });

    await question.save();

    res.json({ message: 'Submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
