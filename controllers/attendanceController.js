import mongoose from "mongoose";
import Student from "../models/Student.js";
import StudentAttendance from "../models/StudentAttendance.js";
import Subject from "../models/subjectModel.js";
import ExcelJS from "exceljs";
import AttendanceEditRequest from "../models/AttendanceEditRequest.js";

/* =========================================================
   POST — MARK SINGLE ATTENDANCE
========================================================= */

export const markAttendance = async (req, res) => {
  try {

    const { studentId, subjectId, date, hour, status } = req.body;
    const facultyId = req.user.facultyId;

    if (!studentId || !subjectId || !date || !hour || !status) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const formattedDate = new Date(date);

    const existing = await StudentAttendance.findOne({
      studentId,
      subjectId,
      date: formattedDate,
      hour
    });

    if (existing) {

      if (!existing.editApproved && req.user.role !== "HOD") {
        return res.status(400).json({
          message: "Attendance locked. Raise edit request."
        });
      }

      existing.status = status;
      existing.markedBy = facultyId;
      existing.editApproved = false;

      await existing.save();

      return res.status(200).json({
        message: "Attendance updated successfully",
        attendance: existing
      });
    }

    const attendance = new StudentAttendance({
      studentId,
      subjectId,
      date: formattedDate,
      hour,
      status,
      markedBy: facultyId,
      editApproved: false
    });

    await attendance.save();

    return res.status(200).json({
      message: `Marked ${status} successfully`,
      attendance
    });

  } catch (error) {

    console.error("Mark Attendance Error:", error);

    return res.status(500).json({
      message: error.message
    });

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

    const formattedDate = new Date(date);

    const existingAttendance = await StudentAttendance.find({
      subjectId,
      date: formattedDate,
      hour
    });

    if (existingAttendance.length > 0 && req.user.role !== "HOD") {
      return res.status(400).json({
        message: "Attendance already marked. Only HOD can edit."
      });
    }

    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: {
          studentId: rec.studentId,
          subjectId,
          date: formattedDate,
          hour
        },
        update: {
          $set: {
            studentId: rec.studentId,
            subjectId,
            date: formattedDate,
            hour,
            status: rec.status,
            markedBy: facultyId,
            editApproved: false
          }
        },
        upsert: true
      }
    }));

    await StudentAttendance.bulkWrite(bulkOps);

    return res.status(200).json({
      message: "Attendance saved successfully",
      total: records.length
    });

  } catch (error) {

    console.error("Bulk Attendance Error:", error);

    return res.status(500).json({
      message: error.message
    });

  }
};


/* =========================================================
   GET — DATE FILTER
========================================================= */

export const getAttendanceByDate = async (req, res) => {
  try {

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const formattedDate = new Date(date);

    const attendance = await StudentAttendance.find({
      date: formattedDate
    });

    return res.status(200).json({
      message: "Attendance fetched successfully",
      count: attendance.length,
      attendance
    });

  } catch (error) {

    console.error("Get Attendance Error:", error);

    return res.status(500).json({
      message: error.message
    });

  }
};


/* =========================================================
   GET — SUBJECT + DATE FILTER
========================================================= */

export const getAttendanceBySubjectAndDate = async (req, res) => {
  try {

    const { subjectId, date } = req.query;

    if (!subjectId || !date) {
      return res.status(400).json({
        message: "SubjectId and Date are required"
      });
    }

    const formattedDate = new Date(date);

    const attendance = await StudentAttendance.find({
      subjectId,
      date: formattedDate
    });

    return res.status(200).json({
      message: "Attendance fetched successfully",
      count: attendance.length,
      attendance
    });

  } catch (error) {

    console.error("Get Attendance Error:", error);

    return res.status(500).json({
      message: error.message
    });

  }
};


/* =========================================================
   GET — STUDENTS WITH ATTENDANCE STATUS
========================================================= */

export const getAttendanceStudents = async (req, res) => {
  try {

    let { department, year, section, subjectId, date, hour } = req.query;

    if (!department || !year || !section || !subjectId) {
      return res.status(400).json({
        message: "Missing query parameters"
      });
    }

    if (section.startsWith("Section ")) {
      section = section.replace("Section ", "");
    }

    const students = await Student.find({
      department: { $regex: new RegExp(`^${department.trim()}$`, "i") },
      year: { $regex: new RegExp(year.trim(), "i") },
      section: { $regex: new RegExp(`^${section.trim()}$`, "i") }
    }).sort({ rollNumber: 1 });

    let statusMap = {};

    if (date && hour) {

      const formattedDate = new Date(date);

      const attendance = await StudentAttendance.find({
        subjectId,
        date: formattedDate,
        hour
      });

      attendance.forEach((a) => {
        statusMap[a.studentId.toString()] = {
          status: a.status,
          editApproved: a.editApproved
        };
      });
    }

    const result = students.map((s) => ({
      _id: s._id,
      rollNumber: s.rollNumber,
      name: `${s.firstName} ${s.lastName}`,
      status: statusMap[s._id]?.status || null,
      editApproved: statusMap[s._id]?.editApproved || false
    }));

    return res.status(200).json({
      total: result.length,
      students: result
    });

  } catch (error) {

    console.error("Get Attendance Students Error:", error);

    return res.status(500).json({
      message: error.message
    });

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
        message: "All query parameters are required"
      });
    }

    const formattedDate = new Date(date);

    const subject = await Subject.findById(subjectId);

    const students = await Student.find({
      department,
      year,
      section
    }).sort({ rollNumber: 1 });

    const attendanceRecords = await StudentAttendance.find({
      subjectId,
      date: formattedDate,
      hour
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
        status
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
        absent: absentCount
      },
      attendanceList
    });

  } catch (error) {

    console.error("Attendance Print Error:", error);

    return res.status(500).json({
      message: "Server Error",
      error: error.message
    });

  }
};


/* =========================================================
   DOWNLOAD EXCEL
========================================================= */

export const downloadAttendanceExcel = async (req, res) => {
  try {

    let { department, year, section, subjectId, date } = req.query;

    const subject = await Subject.findById(subjectId);

    const students = await Student.find({
      department,
      year,
      section
    }).sort({ rollNumber: 1 });

    const formattedDate = new Date(date);

    const attendanceRecords = await StudentAttendance.find({
      subjectId,
      date: formattedDate
    });

    let statusMap = {};

    attendanceRecords.forEach((record) => {
      statusMap[record.studentId.toString()] = record.status;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    worksheet.addRow(["Attendance Report"]).font = { bold: true };

    worksheet.addRow(["Faculty", req.user.name]);
    worksheet.addRow(["Subject", subject.subject]);
    worksheet.addRow(["Date", formattedDate]);

    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      "S.No",
      "Roll Number",
      "Name",
      "Status"
    ]);

    headerRow.font = { bold: true };

    students.forEach((student, index) => {
      worksheet.addRow([
        index + 1,
        student.rollNumber,
        `${student.firstName} ${student.lastName}`,
        statusMap[student._id.toString()] || "Absent"
      ]);
    });

    worksheet.columns.forEach((col) => (col.width = 20));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance_${formattedDate}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {

    console.error("Excel Error:", error);

    res.status(500).json({
      message: error.message
    });

  }
};


/* =========================================================
   STAFF → RAISE EDIT REQUEST
========================================================= */

export const raiseAttendanceEditRequest = async (req, res) => {
  try {

    const {
      subjectId,
      sectionId,
      studentId,
      date,
      hour,
      hourLabel,
      currentStatus,
      requestedStatus
    } = req.body;

    const facultyId = req.user.facultyId;

    if (
      !subjectId ||
      !sectionId ||
      !studentId ||
      !date ||
      !hour ||
      !currentStatus ||
      !requestedStatus
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    const formattedDate = new Date(date);

    /* prevent duplicate request */

    const existingRequest = await AttendanceEditRequest.findOne({
      studentId,
      subjectId,
      date: formattedDate,
      hour,
      status: "Pending"
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Edit request already pending for this student"
      });
    }

    const request = new AttendanceEditRequest({
      facultyId,
      subjectId,
      sectionId,
      studentId,
      date: formattedDate,
      hour,
      hourLabel,
      currentStatus,
      requestedStatus,
      status: "Pending"
    });

    await request.save();

    res.status(200).json({
      success: true,
      message: "Edit request sent to HOD",
      data: request
    });

  } catch (error) {

    console.error("Raise Request Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


/* =========================================================
   HOD → VIEW REQUESTS
========================================================= */

export const getAttendanceEditRequests = async (req, res) => {
  try {

    const requests = await AttendanceEditRequest.find({
      status: "Pending"
    })
      .populate("studentId", "firstName lastName rollNumber")
      .populate("facultyId", "name");

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


/* =========================================================
   HOD → APPROVE EDIT REQUEST
========================================================= */

export const approveAttendanceEdit = async (req, res) => {
  try {

    const { requestId } = req.params;

    const request = await AttendanceEditRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    const attendance = await StudentAttendance.findOneAndUpdate(
      {
        studentId: request.studentId,
        subjectId: request.subjectId,
        date: request.date,
        hour: request.hour
      },
      {
        status: request.requestedStatus,
        editApproved: true
      },
      { new: true }
    );

    request.status = "Approved";
    await request.save();

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      attendance
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


/* =========================================================
   HOD → REJECT REQUEST
========================================================= */

export const rejectAttendanceEdit = async (req, res) => {

  try {

    const { requestId } = req.params;

    await AttendanceEditRequest.findByIdAndUpdate(
      requestId,
      { status: "Rejected" }
    );

    res.json({
      success: true,
      message: "Request rejected"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};