import Quiz from '../models/Quiz.js';

/*
--------------------------------
CREATE QUIZ
--------------------------------
*/
export const createQuiz = async (req, res) => {
  try {
    const { subjectId, sectionId, title, dueDate, questions } = req.body;

    // Basic validation
    if (!subjectId || !sectionId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const staffId = req.user.facultyId;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quiz must contain at least one question'
      });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (
        !q.questionText ||
        !Array.isArray(q.options) ||
        q.options.length < 2
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid question structure at index ${i}`
        });
      }

      if (!Array.isArray(q.correctAnswers) || q.correctAnswers.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Correct answer missing for question ${i + 1}`
        });
      }
    }

    const quiz = await Quiz.create({
      subjectId,
      sectionId,
      staffId,
      title,
      dueDate,
      questions,
      marks: questions.length
    });

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
--------------------------------
GET QUIZZES
--------------------------------
*/
export const getQuizzes = async (req, res) => {
  try {
    const { subjectId, sectionId } = req.params;

    if (!subjectId || !sectionId) {
      return res.status(400).json({
        success: false,
        message: 'subjectId and sectionId are required'
      });
    }

    const quizzes = await Quiz.find({
      subjectId,
      sectionId
    })
      .populate('subjectId')
      .populate('staffId'); // sectionId is now a string, do not populate

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
--------------------------------
GET SINGLE QUIZ
--------------------------------
*/
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('subjectId')
      .populate('sectionId')
      .populate('staffId');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
--------------------------------
SUBMIT QUIZ
--------------------------------
*/
export const submitQuiz = async (req, res) => {
  try {
    const { studentId, answers } = req.body;

    if (!studentId || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid submission data'
      });
    }

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check due date
    if (new Date() > quiz.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Quiz deadline passed'
      });
    }

    // Prevent duplicate submission
    const alreadySubmitted = quiz.submissions.find(
      (s) => s.studentId.toString() === studentId
    );

    if (alreadySubmitted) {
      return res.status(400).json({
        success: false,
        message: 'Quiz already submitted'
      });
    }

    let marks = 0;

    quiz.questions.forEach((q, index) => {
      const studentAnswer = answers.find((a) => a.questionIndex === index);

      if (!studentAnswer) return;

      const correct = [...q.correctAnswers].sort().toString();
      const selected = [...studentAnswer.selectedOptions].sort().toString();

      if (correct === selected) marks += 1;
    });

    const submission = {
      studentId,
      answers,
      marksObtained: marks
    };

    quiz.submissions.push(submission);

    await quiz.save();

    res.status(200).json({
      success: true,
      marksObtained: marks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
--------------------------------
GET QUIZ SUBMISSIONS
--------------------------------
*/
export const getQuizSubmissions = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate(
      'submissions.studentId'
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz.submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
--------------------------------
UPDATE QUIZ
--------------------------------
*/
export const updateQuiz = async (req, res) => {
  try {
    const { title, dueDate, questions } = req.body;

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (quiz.submissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update quiz after submissions'
      });
    }

    if (title) quiz.title = title;
    if (dueDate) quiz.dueDate = dueDate;

    if (questions) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Questions must be a non-empty array'
        });
      }

      quiz.questions = questions;
      quiz.marks = questions.length;
    }

    await quiz.save();

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
--------------------------------
DELETE QUIZ
--------------------------------
*/
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
