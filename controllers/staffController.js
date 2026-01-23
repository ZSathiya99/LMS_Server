import AdminAllocation from "../models/adminAllocationModel.js";


export const getStaffSubjectPlanning = async (req, res) => {
  try {
    const staffId = req.user.facultyId; // faculty _id from token

    const allocations = await AdminAllocation.find({
      "subjects.sections.staff.id": staffId.toString(),
    });

    const result = [];

    allocations.forEach((allocation) => {
      allocation.subjects.forEach((subject) => {
        subject.sections.forEach((section) => {
          if (section.staff?.id?.toString() === staffId.toString()) {
            result.push({
              subjectId: subject._id,          // 🔥 THIS IS WHAT YOU NEED
              department: allocation.department,
              regulation: allocation.regulation,
              semester: allocation.semester,
              semesterType: allocation.semesterType,
              subjectCode: subject.code,
              subjectName: subject.subject,
              credits: subject.credits,
              sectionName: section.sectionName,
            });
          }
        });
      });
    });

    return res.status(200).json({
      total: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Subject Planning Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

