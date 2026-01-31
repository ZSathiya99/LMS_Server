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



