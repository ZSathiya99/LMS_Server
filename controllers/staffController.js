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

    // 🔥 Image list
    const imageList = [
      "/images/banner1.png",
      "/images/banner2.png",
      "/images/banner3.png",
      "/images/banner4.png",
      "/images/banner5.png",
    ];

    // 🔥 Random image function
    const getRandomImage = () => {
      const randomIndex = Math.floor(Math.random() * imageList.length);
      return imageList[randomIndex];
    };

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
              image: getRandomImage(), // 🔥 Random image per subject
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



