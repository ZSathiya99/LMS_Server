import mongoose from "mongoose";
import Student from "../models/Student.js";
import StudentAttendance from "../models/StudentAttendance.js";
import Subject from "../models/subjectModel.js";

/* =========================================================
   POST — MARK SINGLE ATTENDANCE
========================================================= */
export const markAttendance = async (req, res) => {
  try {
    let { studentId, subjectId, date, hour, status } = req.body;
    const facultyId = req.user.facultyId;

    if (!studentId || !subjectId || !date || !hour || !status) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const formattedDate = new Date(date).toISOString().split("T")[0];

    const attendance = await StudentAttendance.findOneAndUpdate(
      {
        studentId: studentId.toString().trim(),
        subjectId: subjectId.toString().trim(),
        date: formattedDate,
        hour: hour.toString().trim(),
      },
      {
        $set: {
          studentId: studentId.toString().trim(),
          subjectId: subjectId.toString().trim(),
          date: formattedDate,
          hour: hour.toString().trim(),
          status,
          markedBy: facultyId.toString(),
        },
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
   POST — BULK ATTENDANCE
========================================================= */
export const markBulkAttendance = async (req, res) => {
  try {
    const { subjectId, date, hour, records } = req.body;
    const facultyId = req.user.facultyId;

    if (!subjectId || !date || !hour || !records?.length) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const formattedDate = new Date(date).toISOString().split("T")[0];

    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: {
          studentId: rec.studentId.toString().trim(),
          subjectId: subjectId.toString().trim(),
          date: formattedDate,
          hour: hour.toString().trim(),
        },
        update: {
          $set: {
            studentId: rec.studentId.toString().trim(),
            subjectId: subjectId.toString().trim(),
            date: formattedDate,
            hour: hour.toString().trim(),
            status: rec.status,
            markedBy: facultyId.toString(),
          },
        },
        upsert: true,
      },
    }));

    await StudentAttendance.bulkWrite(bulkOps);

    return res.status(200).json({
      message: "Attendance saved successfully",
      total: records.length,
    });
  } catch (error) {
    console.error("Bulk Attendance Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   GET — DATE-WISE FILTER
========================================================= */
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date, subjectId, hour } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const formattedDate = new Date(date).toISOString().split("T")[0];

    let filter = { date: formattedDate };
    if (subjectId) filter.subjectId = subjectId;
    if (hour) filter.hour = hour;

    const attendance = await StudentAttendance.find(filter);

    return res.status(200).json({
      message: "Attendance fetched successfully",
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    console.error("Get Attendance Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   GET — STUDENTS WITH STATUS
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
      department: { $regex: new RegExp(`^${department.trim()}$`, "i") },
      year: { $regex: new RegExp(year.trim(), "i") }, // Handles "2nd Year"
      section: { $regex: new RegExp(`^${section.trim()}$`, "i") },
    }).sort({ rollNumber: 1 });

    let statusMap = {};

    if (date && hour) {
      const formattedDate = new Date(date).toISOString().split("T")[0];

      const attendance = await StudentAttendance.find({
        subjectId: subjectId.toString().trim(),
        date: formattedDate,
        hour: hour.toString().trim(),
      });

      attendance.forEach((a) => {
        statusMap[a.studentId.toString()] = a.status;
      });
    }

    const result = students.map((s) => ({
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

/* =========================================================
   GET — PRINT ATTENDANCE
========================================================= */
export const getAttendancePrint = async (req, res) => {
  try {
    let { department, year, section, subjectId, date, hour } = req.query;

    if (!department || !year || !section || !subjectId || !date || !hour) {
      return res.status(400).json({
        message: "All query parameters are required",
      });
    }

    if (section.startsWith("Section ")) {
      section = section.replace("Section ", "");
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const students = await Student.find({
      department: { $regex: new RegExp(`^${department.trim()}$`, "i") },
      year: { $regex: new RegExp(year.trim(), "i") },
      section: { $regex: new RegExp(`^${section.trim()}$`, "i") },
    }).sort({ rollNumber: 1 });

    if (!students.length) {
      return res.status(404).json({ message: "No students found" });
    }

    const formattedDate = new Date(date).toISOString().split("T")[0];

    const attendanceRecords = await StudentAttendance.find({
      subjectId,
      date: formattedDate,
      hour: hour.toString().trim(),
    });

    let statusMap = {};
    attendanceRecords.forEach((record) => {
      statusMap[record.studentId.toString()] = record.status;
    });

    let presentCount = 0;
    let absentCount = 0;

    const attendanceList = students.map((student, index) => {
      const status = statusMap[student._id.toString()] || "Absent";
      if (status === "Present") presentCount++;
      else absentCount++;

      return {
        sno: index + 1,
        rollNumber: student.rollNumber,
        name: `${student.firstName} ${student.lastName}`,
        status,
      };
    });

    return res.status(200).json({
      printDetails: {
        facultyName: req.user.name,
        department,
        year,
        section,
        subjectName: subject.subject,
        subjectCode: subject.code,
        date: formattedDate,
        hour,
        totalStudents: students.length,
        present: presentCount,
        absent: absentCount,
      },
      attendanceList,
    });
  } catch (error) {
    console.error("Attendance Print Error:", error);
    return res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};
