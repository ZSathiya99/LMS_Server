// import Attendance from "../models/Attendance.js";
import Course from "../models/CoursePlan.js";
import TimeTable from "../models/Timetable.js";


/* =====================================
   1. Faculty Attendance (Checkin/Checkout)
===================================== */

// export const getFacultyAttendance = async (req, res) => {
//   try {

//     const { facultyId } = req.params;

//     const attendance = await Attendance.find({
//       facultyId: facultyId
//     }).sort({ date: -1 });

//     res.status(200).json({
//       success: true,
//       message: "Faculty attendance fetched successfully",
//       count: attendance.length,
//       data: attendance
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch attendance",
//       error: error.message
//     });

//   }
// };



/* =====================================
   2. Faculty Subject List (Assigned by HOD)
===================================== */

export const getFacultySubjects = async (req, res) => {
  try {

    const { facultyId } = req.params;

    const subjects = await Course.find({ facultyId })
      .populate("sectionId", "sectionName") // optional if section model exists
      .select("courseCode courseTitle year program sectionId");

    const formattedSubjects = subjects.map((item) => ({
      subjectCode: item.courseCode,
      subject: item.courseTitle,
      year: item.year,
      department: item.program,
      section: item.sectionId?.sectionName || item.sectionId
    }));

    res.status(200).json({
      success: true,
      count: formattedSubjects.length,
      data: formattedSubjects
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch subjects",
      error: error.message
    });

  }
};



/* =====================================
   3. Faculty Timetable (Assigned by HOD)
===================================== */

export const getFacultyTimetable = async (req, res) => {
  try {

    const { facultyId } = req.params;

    const timetable = await TimeTable.find({
      "days.slots.facultyId": facultyId
    });

    res.status(200).json({
      success: true,
      message: "Faculty timetable fetched successfully",
      count: timetable.length,
      data: timetable
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
      error: error.message
    });

  }
};