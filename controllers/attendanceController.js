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

    // 🔥 FORCE YYYY-MM-DD FORMAT
    const formattedDate = new Date(date).toISOString().split("T")[0];

    studentId = studentId.toString().trim();
    subjectId = subjectId.toString().trim();

    const attendance = await StudentAttendance.findOneAndUpdate(
      {
        studentId,
        subjectId,
        date: formattedDate,
        hour,
      },
      {
        studentId,
        subjectId,
        date: formattedDate,
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


//bulk 
export const markBulkAttendance = async (req, res) => {
  try {
    const { subjectId, date, hour, records } = req.body;

    const staffId = req.user.facultyId;

    if (!subjectId || !date || !hour || !records?.length) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // 🔥 Force YYYY-MM-DD format
    const formattedDate = new Date(date).toISOString().split("T")[0];

    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: {
          studentId: rec.studentId.toString().trim(),
          subjectId: subjectId.toString().trim(),
          date: formattedDate,
          hour,
        },
        update: {
          $set: {
            studentId: rec.studentId.toString().trim(),
            subjectId: subjectId.toString().trim(),
            date: formattedDate,
            hour,
            status: rec.status,
            markedBy: staffId.toString(),
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





//Date-wise Attendance Filter API

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

    res.status(200).json({
      message: "Attendance fetched successfully",
      count: attendance.length,
      attendance,
    });

  } catch (error) {
    console.error("Get Attendance Error:", error);
    res.status(500).json({ message: error.message });
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
      status: statusMap[s._id.toString()] || "null",
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



export const getAttendancePrint = async (req, res) => {
  try {
    const facultyId = req.user.facultyId; // from verifyToken

    let { department, year, section, subjectId, date, hour } = req.query;

    // ==============================
    // 1️⃣ VALIDATION
    // ==============================
    if (!department || !year || !section || !subjectId || !date || !hour) {
      return res.status(400).json({
        message: "All query parameters are required",
      });
    }

    if (section.startsWith("Section ")) {
      section = section.replace("Section ", "");
    }

    // ==============================
    // 2️⃣ OPTIONAL: CHECK SUBJECT BELONGS TO FACULTY
    // ==============================
    const subject = await Subject.findOne({
      _id: subjectId,
      facultyId: facultyId,
    });

    if (!subject) {
      return res.status(403).json({
        message: "You are not assigned to this subject",
      });
    }

    // ==============================
    // 3️⃣ GET STUDENTS
    // ==============================
    const students = await Student.find({
      department,
      year,
      section,
    }).sort({ rollNumber: 1 });

    if (!students.length) {
      return res.status(404).json({
        message: "No students found",
      });
    }

    // ==============================
    // 4️⃣ GET ATTENDANCE
    // ==============================
    const attendanceList = await StudentAttendance.find({
      subjectId,
      date,
      hour,
    });

    let statusMap = {};
    attendanceList.forEach((a) => {
      statusMap[a.studentId.toString()] = a.status;
    });

    // ==============================
    // 5️⃣ FORMAT DATA
    // ==============================
    let presentCount = 0;
    let absentCount = 0;

    const result = students.map((s, index) => {
      const status = statusMap[s._id.toString()] || "Absent";

      if (status === "Present") presentCount++;
      else absentCount++;

      return {
        sno: index + 1,
        rollNumber: s.rollNumber,
        name: `${s.firstName} ${s.lastName}`,
        status,
      };
    });

    // ==============================
    // 6️⃣ FINAL RESPONSE (PRINT READY)
    // ==============================
    return res.status(200).json({
      printDetails: {
        faculty: req.user.name,
        department,
        year,
        section,
        subject: subject.subjectName,
        date,
        hour,
        totalStudents: students.length,
        present: presentCount,
        absent: absentCount,
      },
      attendanceList: result,
    });

  } catch (error) {
    console.error("Attendance Print Error:", error);
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

