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

    const imageList = [
      "/images/banner1.png",
      "/images/banner2.png",
      "/images/banner3.png",
      "/images/banner4.png",
      "/images/banner5.png",
    ];

    const getRandomImage = () => {
      const randomIndex = Math.floor(Math.random() * imageList.length);
      return imageList[randomIndex];
    };

    const allocations = await AdminAllocation.find({
      "subjects.sections.staff.id": staffId.toString(),
    });

    const result = [];

    for (const allocation of allocations) {
      let isModified = false;

      for (const subject of allocation.subjects) {
        for (const section of subject.sections) {
          if (section.staff?.id?.toString() === staffId.toString()) {

            // ✅ CHECK classroomCode INSIDE SECTION
            if (!section.classroomCode) {
              const randomCode = Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

              section.classroomCode = `${subject.code}-${randomCode}`;
              isModified = true;
            }

            result.push({
              subjectId: subject._id,
              department: allocation.department,
              regulation: allocation.regulation,
              semester: allocation.semester,
              semesterType: allocation.semesterType,
              year: getAcademicYear(allocation.semester),
              subjectCode: subject.code,
              subjectName: subject.subject,
              sectionName: section.sectionName,
              classroomCode: section.classroomCode, // ✅ RETURN THIS
              image: getRandomImage(),
            });
          }
        }
      }

      if (isModified) {
        allocation.markModified("subjects");
        await allocation.save();
      }
    }

    return res.status(200).json({
      total: result.length,
      data: result,
    });

  } catch (error) {
    console.error("Subject Planning Error:", error);
    return res.status(500).json({ message: error.message });
  }
};





