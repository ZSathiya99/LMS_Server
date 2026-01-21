// controllers/attendanceController.js

import AdminAllocation from "../models/adminAllocationModel.js";
import Student from "../models/Student.js";
import StudentAttendance from "../models/StudentAttendance.js";



/* =========================================================
   GET ATTENDANCE OVERVIEW (Previous Screen)
========================================================= */
export const getAttendanceOverview = async (req, res) => {
  try {
    const staffId = req.user.id; // from JWT

    const allocations = await AdminAllocation.find({
      "subjects.sections.staff.id": staffId,
    });

    if (!allocations || allocations.length === 0) {
      return res.status(200).json({
        message: "No attendance sections found",
        total: 0,
        data: [],
      });
    }

    const result = [];

    for (const allocation of allocations) {
      const { department, semester, semesterType, regulation } = allocation;

      for (const subject of allocation.subjects) {
        for (const section of subject.sections) {
          if (section.staff?.id?.toString() === staffId.toString()) {
            const studentCount = await Student.countDocuments({
              department,
              semester,
              section: section.sectionName,
            });

            result.push({
              year: `${semester} Year`,
              department,
              section: section.sectionName,
              students: studentCount,
              subjectId: subject._id,
              subjectCode: subject.code,
              subjectName: subject.subject,
              semesterType,
              regulation,
            });
          }
        }
      }
    }

    return res.status(200).json({
      message: "Attendance overview fetched successfully",
      total: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Attendance Overview Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   MARK PRESENT
========================================================= */
export const markPresent = async (req, res) => {
  try {
    const {
      studentId,
      rollNo,
      name,
      department,
      year,
      subjectCode,
      section,
      date,
      hour,
    } = req.body;

    const facultyId = req.user.id;

    if (!studentId || !date || !hour) {
      return res.status(400).json({
        message: "studentId, date and hour are required",
      });
    }

    const attendance = await StudentAttendance.findOneAndUpdate(
      { studentId, date, hour },
      {
        studentId,
        rollNo,
        name,
        department,
        year,
        subjectCode,
        section,
        date,
        hour,
        status: "Present",
        markedBy: facultyId,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Student marked Present",
      attendance,
    });
  } catch (error) {
    console.error("Mark Present Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   MARK ABSENT
========================================================= */
export const markAbsent = async (req, res) => {
  try {
    const {
      studentId,
      rollNo,
      name,
      department,
      year,
      subjectCode,
      section,
      date,
      hour,
    } = req.body;

    const facultyId = req.user.id;

    if (!studentId || !date || !hour) {
      return res.status(400).json({
        message: "studentId, date and hour are required",
      });
    }

    const attendance = await StudentAttendance.findOneAndUpdate(
      { studentId, date, hour },
      {
        studentId,
        rollNo,
        name,
        department,
        year,
        subjectCode,
        section,
        date,
        hour,
        status: "Absent",
        markedBy: facultyId,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Student marked Absent",
      attendance,
    });
  } catch (error) {
    console.error("Mark Absent Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   MARK ON-DUTY
========================================================= */
export const markOnDuty = async (req, res) => {
  try {
    const { studentId, date, hour } = req.body;
    const facultyId = req.user.id;

    if (!studentId || !date || !hour) {
      return res.status(400).json({
        message: "studentId, date and hour are required",
      });
    }

    const attendance = await StudentAttendance.findOneAndUpdate(
      { studentId, date, hour },
      {
        status: "On-Duty",
        markedBy: facultyId,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: "Student marked On-Duty",
      attendance,
    });
  } catch (error) {
    console.error("Mark On-Duty Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
