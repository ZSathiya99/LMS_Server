import Student from "../models/Student.js";
import StudentAttendance from "../models/StudentAttendance.js";


/* =========================================================
   POST — MARK ATTENDANCE (Present / Absent / On-Duty)
========================================================= */
export const markAttendance = async (req, res) => {
  try {
    let { studentId, subjectId, date, hour, status } = req.body;

    const staffId = req.user.facultyId;

    if (!studentId || !subjectId || !date || !hour || !status) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // 🔥 FORCE STRING FORMAT
    studentId = studentId.toString().trim();
    subjectId = subjectId.toString().trim();

    const attendance = await StudentAttendance.findOneAndUpdate(
      { studentId, subjectId, date, hour },
      {
        studentId,
        subjectId,
        date,
        hour,
        status,
        markedBy: staffId.toString(),
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: `Marked ${status} successfully`,
      attendance,
    });

  } catch (error) {
    console.error("Mark Attendance Error:", error);
    return res.status(500).json({ message: error.message });
  }
};



/* =========================================================
   GET — STUDENT LIST WITH STATUS (DEFAULT ABSENT)
========================================================= */
export const getAttendanceStudents = async (req, res) => {
  try {
    let { department, year, section, subjectId, date, hour } = req.query;

    if (!department || !year || !section || !subjectId) {
      return res.status(400).json({ message: "Missing query parameters" });
    }

    if (section.startsWith("Section ")) {
      section = section.replace("Section ", "");
    }

    const students = await Student.find({
      department,
      year,
      section,
    }).sort({ rollNumber: 1 });

    let statusMap = {};

    if (date && hour) {
      const attendance = await StudentAttendance.find({
        subjectId: subjectId.toString().trim(),
        date: date.toString().trim(),
        hour: hour.toString().trim(),
      });

      attendance.forEach(a => {
        statusMap[a.studentId.toString()] = a.status;
      });
    }

    const result = students.map(s => ({
      _id: s._id,
      rollNumber: s.rollNumber,
      name: `${s.firstName} ${s.lastName}`,
      status: statusMap[s._id.toString()] || "Absent",
    }));

    return res.status(200).json({
      total: result.length,
      students: result,
    });

  } catch (error) {
    console.error("Get Attendance Students Error:", error);
    return res.status(500).json({ message: error.message });
  }
};



