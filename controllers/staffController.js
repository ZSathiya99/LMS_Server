import AdminAllocation from "../models/adminAllocationModel.js";


export const getStaffSubjectPlanning = async (req, res) => {
  try {
    console.log(req)
    const staffId = req.user.facultyId;

    const allocations = await AdminAllocation.find({
      "subjects.sections.staff.id": staffId,
    });

    const result = [];

    allocations.forEach((allocation) => {
      allocation.subjects.forEach((subject) => {
        subject.sections.forEach((section) => {
          if (section.staff?.id === staffId) {
            result.push({
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

    res.json({ data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
