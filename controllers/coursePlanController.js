import CoursePlan from "../models/CoursePlan.js";

export const saveCoursePlan = async (req, res) => {
  try {
    const { subjectId, sectionId, step, data } = req.body;

    if (!subjectId || !sectionId || !step) {
      return res.status(400).json({
        message: "subjectId, sectionId and step are required"
      });
    }

    let coursePlan = await CoursePlan.findOne({ subjectId, sectionId });

    if (!coursePlan) {
      coursePlan = new CoursePlan({ subjectId, sectionId });
    }

    // 🔥 Merge only that step (NO OVERWRITE)
    coursePlan[step] = data;

    // 🔥 Auto Completion Calculation
    const totalSteps = 4;
    let completed = 0;

    if (coursePlan.courseDetails) completed++;
    if (coursePlan.coPoMapping?.length) completed++;
    if (coursePlan.references) completed++;
    if (coursePlan.lessonPlanner?.theory?.length ||
        coursePlan.lessonPlanner?.lab?.length) completed++;

    coursePlan.completionPercentage =
      Math.round((completed / totalSteps) * 100);

    await coursePlan.save();

    res.json({
      message: `${step} saved successfully`,
      completion: coursePlan.completionPercentage,
      data: coursePlan
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
export const getCoursePlan = async (req, res) => {
  try {
    const { subjectId, sectionId } = req.params;

    const coursePlan = await CoursePlan.findOne({
      subjectId,
      sectionId
    });

    res.json(coursePlan || {});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};