// import Attendance from "../models/Attendance.js";
import Course from "../models/CoursePlan.js";
import TimeTable from "../models/Timetable.js";
import CoursePlan from "../models/CoursePlan.js";
import mongoose from "mongoose";
import AdminAllocation from "../models/adminAllocationModel.js";


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

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: "FacultyId is required"
      });
    }

    const subjects = await CoursePlan.find({
      facultyId: new mongoose.Types.ObjectId(facultyId)
    })
      .select("courseCode courseTitle year program sectionId")
      .lean();

    const formattedSubjects = [];

    for (const item of subjects) {

      let section = "";

      const allocation = await AdminAllocation.findOne({
        "subjects.sections._id": item.sectionId
      }).lean();

      if (allocation) {

        for (const sub of allocation.subjects) {

          for (const sec of sub.sections) {

            if (sec._id.toString() === item.sectionId.toString()) {
              section = sec.sectionName.replace("Section ", "");
              break;
            }

          }

          if (section) break;
        }

      }

      formattedSubjects.push({
        subjectCode: item.courseCode,
        subject: item.courseTitle,
        year: item.year,
        department: item.program,
        section
      });

    }

    res.status(200).json({
      success: true,
      count: formattedSubjects.length,
      data: formattedSubjects
    });

  } catch (error) {

    console.error("Fetch Faculty Subjects Error:", error);

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

    if (!facultyId) {
      return res.status(400).json({
        success: false,
        message: "FacultyId is required"
      });
    }

    const timetable = await TimeTable.find({
      "days.slots.facultyId": facultyId
    }).lean();

    res.status(200).json({
      success: true,
      message: "Faculty timetable fetched successfully",
      count: timetable.length,
      data: timetable
    });

  } catch (error) {

    console.error("Faculty Timetable Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch timetable",
      error: error.message
    });

  }
};