import CoursePlan from '../models/CoursePlan.js';
import AdminAllocation from '../models/adminAllocationModel.js';
import Faculty from '../models/Faculty.js';

const PATCH_ALLOWED_STEPS = [
  'courseDetails',
  'coPoMapping',
  'references',
  'theoryPlanner'
];

const GET_ALLOWED_STEPS = [
  'courseDetails',
  'coPoMapping',
  'references',
  'theoryPlanner',
  'all'
];

const getAcademicYear = (regulation) => {
  const r = parseInt(regulation);
  return `${r - 1}-${r}`;
};

const getYearFromSemester = (sem) =>
  sem % 2 === 0 ? sem / 2 : Math.floor(sem / 2) + 1;

/* =========================
   UPDATE STEP
========================= */

export const updateCoursePlanStep = async (req, res) => {
  try {
    const { step } = req.params;
    const { sectionId, subjectId, data } = req.body;

    if (!PATCH_ALLOWED_STEPS.includes(step)) {
      return res.status(400).json({ success: false, message: 'Invalid step' });
    }

    if (!sectionId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'sectionId and subjectId required'
      });
    }

    let existing = await CoursePlan.findOne({ sectionId, subjectId });

    /* FIRST CREATION */
    if (!existing && step === 'courseDetails') {
      const faculty = await Faculty.findById(req.user.facultyId);
      if (!faculty)
        return res
          .status(404)
          .json({ success: false, message: 'Faculty not found' });

      const allocation = await AdminAllocation.findOne({
        'subjects.subjectId': subjectId
      });

      if (!allocation)
        return res
          .status(404)
          .json({ success: false, message: 'Allocation not found' });

      const subject = allocation.subjects.find(
        (s) => s.subjectId.toString() === subjectId.toString()
      );

      const semester = allocation.semester;

      const newDoc = await CoursePlan.create({
        sectionId,
        subjectId,
        academicYear: getAcademicYear(allocation.regulation),
        semester,
        year: getYearFromSemester(semester),
        courseCode: subject?.code,
        courseTitle: subject?.subject,
        program: allocation.department,
        facultyId: faculty._id,
        facultyName: `${faculty.salutation}${faculty.firstName} ${faculty.lastName}`,
        facultyDesignation: faculty.designation,
        facultyDepartment: faculty.department,
        courseDetails: data
      });

      return res.status(200).json({
        success: true,
        data: newDoc.courseDetails
      });
    }

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Save courseDetails first'
      });
    }

    existing[step] = data;
    await existing.save();

    return res.status(200).json({
      success: true,
      data: existing[step]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   GET STEP
========================= */

export const getCoursePlanStep = async (req, res) => {
  try {
    const { step, sectionId, subjectId } = req.params;

    if (!GET_ALLOWED_STEPS.includes(step)) {
      return res.status(400).json({ success: false, message: 'Invalid step' });
    }

    if (step === 'all') {
      const data = await CoursePlan.findOne(
        { sectionId, subjectId },
        { _id: 0, __v: 0 }
      ).lean();

      if (!data)
        return res.status(404).json({
          success: false,
          message: 'Course plan not found'
        });

      return res.status(200).json({ success: true, data });
    }

    const data = await CoursePlan.findOne(
      { sectionId, subjectId },
      { [step]: 1, _id: 0 }
    );

    if (!data)
      return res.status(404).json({
        success: false,
        message: 'Course plan not found'
      });

    return res.status(200).json({
      success: true,
      data: data[step]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteTheoryPlannerTopic = async (req, res) => {
  try {
    const { sectionId, subjectId, unit, topicIndex } = req.body;

    if (!sectionId || !subjectId || !unit) {
      return res.status(400).json({
        success: false,
        message: 'sectionId, subjectId and unit are required'
      });
    }

    const allowedUnits = [
      'UNIT1',
      'UNIT2',
      'UNIT3',
      'UNIT4',
      'UNIT5',
      'OTHERS'
    ];

    if (!allowedUnits.includes(unit)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit'
      });
    }

    const coursePlan = await CoursePlan.findOne({ sectionId, subjectId });

    if (!coursePlan) {
      return res.status(404).json({
        success: false,
        message: 'Course plan not found'
      });
    }

    const topics = coursePlan.theoryPlanner?.[unit]?.topics;

    if (!topics || topics.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No topics found for this unit'
      });
    }

    if (topicIndex < 0 || topicIndex >= topics.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid topic index'
      });
    }

    topics.splice(topicIndex, 1);

    await coursePlan.save();

    return res.status(200).json({
      success: true,
      message: 'Topic deleted successfully',
      data: coursePlan.theoryPlanner[unit]
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
