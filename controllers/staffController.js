import AdminAllocation from "../models/adminAllocationModel.js";


// Helper function
const getAcademicYear = (semester) => {
  if (semester === 1 || semester === 2) return "1st Year";
  if (semester === 3 || semester === 4) return "2nd Year";
  if (semester === 5 || semester === 6) return "3rd Year";
  if (semester === 7 || semester === 8) return "4th Year";
  return `${semester}th Semester`;
};

export const getStaffSubjectPlanning = async (req, res) => {
  try {
    const staffId = req.user.facultyId;

    const allocations = await AdminAllocation.find({
      "subjects.sections.staff.id": staffId.toString(),
    });

    const result = [];

    allocations.forEach((allocation) => {
      allocation.subjects.forEach((subject) => {
        subject.sections.forEach((section) => {
          if (section.staff?.id?.toString() === staffId.toString()) {
            result.push({
              subjectId: subject._id,

              department: allocation.department,
              regulation: allocation.regulation,

              semester: allocation.semester,
              semesterType: allocation.semesterType,

              year: getAcademicYear(allocation.semester),

              subjectCode: subject.code,
              subjectName: subject.subject,
              credits: subject.credits,

              sectionName: section.sectionName,
            });
          }
        });
      });
    });

    // 🔥 Add 5 image URLs
    const images = [
      `${req.protocol}://${req.get("host")}/images/banner1.png`,
      `${req.protocol}://${req.get("host")}/images/banner2.png`,
      `${req.protocol}://${req.get("host")}/images/banner3.png`,
      `${req.protocol}://${req.get("host")}/images/banner4.png`,
      `${req.protocol}://${req.get("host")}/images/banner5.png`,
    ];

    return res.status(200).json({
      total: result.length,
      images,   // ✅ Added here
      data: result,
    });

  } catch (error) {
    console.error("Subject Planning Error:", error);
    return res.status(500).json({ message: error.message });
  }
};



