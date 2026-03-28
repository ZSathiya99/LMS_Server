import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Question from '../models/Question.js';
import ClassroomMembers from '../models/ClassroomMembers.js';
import AdminAllocation from '../models/adminAllocationModel.js';
import Student from '../models/Student.js';

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
    const { subjectId, sectionId } = req.params;
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
//FINAL GET API (Student Questions)
export const getStudentQuestions = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userRole = req.user.role;

    const { subjectId, sectionId } = req.params;

    // 1️⃣ Only student
    if (userRole !== "student") {
      return res.status(403).json({
        message: "Access denied. Only students allowed",
      });
    }

    // 2️⃣ Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({
        message: "Invalid subjectId or sectionId",
      });
    }

    // 3️⃣ Get student
    const student = await Student.findOne({ email: userEmail }).lean();

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // 4️⃣ Check student belongs to this section (SECURITY 🔐)
    const membership = await ClassroomMembers.findOne({
      userId: student._id,
      sectionId: sectionId,
      role: "student",
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not assigned to this section",
      });
    }

    // 5️⃣ Get questions (FILTERED 🔥)
    const questions = await Question.find({
      subjectId,
      sectionId,
    })
      .sort({ createdAt: -1 })
      .lean();

    // 6️⃣ Get subject + section + staff
    const allocation = await AdminAllocation.findOne({
      "subjects.sections._id": sectionId,
    }).lean();

    let subjectName = "";
    let sectionName = "";
    let staffName = "";

    if (allocation) {
      for (const sub of allocation.subjects) {
        if (sub.subjectId.toString() === subjectId.toString()) {
          const section = sub.sections.find(
            (s) => s._id.toString() === sectionId.toString()
          );

          if (section) {
            subjectName = sub.subject;
            sectionName = section.sectionName;
            staffName = section.staff?.name || "";
            break;
          }
        }
      }
    }

    // 7️⃣ Format response
    const results = questions.map((q) => ({
      _id: q._id,

      subjectId: q.subjectId,
      sectionId: q.sectionId,

      title: q.title,
      questionType: q.questionType,
      instruction: q.instruction,
      attachments: q.attachments,
      options: q.options,
      link: q.link,
      youtubeLink: q.youtubeLink,
      marks: q.marks,
      dueDate: q.dueDate,

      subject: subjectName,
      section: sectionName,
      staffName: staffName,
    }));

    res.json({
      totalQuestions: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Student Question Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};