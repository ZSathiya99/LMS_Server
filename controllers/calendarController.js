import Question from '../models/Question.js';
import Assignment from '../models/Assignment.js';

export const getYearlyCalendarData = async (req, res) => {
  try {
    const { facultyId: staffId } = req.user;
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: 'Year is required' });
    }

    const yearNum = parseInt(year);

    // Start and end of the given year
    const startDate = new Date(yearNum, 0, 1);
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59);

    /* =========================
       FETCH QUESTIONS
    ========================== */
    const questions = await Question.find({
      staffId,
      dueDate: { $gte: startDate, $lte: endDate }
    }).select('_id title dueDate marks subjectId questionType');

    /* =========================
       FETCH ASSIGNMENTS
    ========================== */
    const assignments = await Assignment.find({
      staffId,
      dueDate: { $gte: startDate, $lte: endDate }
    }).select('_id title dueDate marks subjectId');

    // Prepare month-wise structure (1–12)
    const formattedQuestions = {};
    const formattedAssignments = {};

    for (let i = 1; i <= 12; i++) {
      formattedQuestions[i] = [];
      formattedAssignments[i] = [];
    }

    // Group questions by month
    questions.forEach((q) => {
      const month = q.dueDate.getMonth() + 1;
      formattedQuestions[month].push(q);
    });

    // Group assignments by month
    assignments.forEach((a) => {
      const month = a.dueDate.getMonth() + 1;
      formattedAssignments[month].push(a);
    });

    return res.status(200).json({
      success: true,
      year: yearNum,
      questions: formattedQuestions,
      assignments: formattedAssignments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
