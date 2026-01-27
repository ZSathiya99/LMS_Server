import Timetable from "../models/Timetable.js";

/* =========================================================
   CREATE / UPDATE TIMETABLE SLOT (ADMIN)
========================================================= */
export const saveTimetableSlot = async (req, res) => {
  try {
    const {
      department,
      year,
      semester,    // 🔥 ADD
      section,
      day,
      time,
      subjectId,
      subjectName,
      facultyId,
      facultyName,
    } = req.body;

    if (
      !department ||
      !year ||
      !semester ||    // 🔥 ADD
      !section ||
      !day ||
      !time ||
      !subjectId ||
      !facultyId
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    let timetable = await Timetable.findOne({
      department,
      year,
      semester,    // 🔥 ADD
      section,
    });

    if (!timetable) {
      timetable = new Timetable({
        department,
        year,
        semester,   // 🔥 ADD
        section,
        days: [],
      });
    }

    let dayObj = timetable.days.find(d => d.day === day);
    if (!dayObj) {
      dayObj = { day, slots: [] };
      timetable.days.push(dayObj);
    }

    dayObj.slots = dayObj.slots.filter(s => s.time !== time);

    dayObj.slots.push({
      time,
      subjectId,
      subjectName,
      facultyId,
      facultyName,
    });

    timetable.markModified("days");
    await timetable.save();

    return res.status(200).json({
      message: "Timetable slot saved successfully",
      timetable,
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//GET TIMETABLE FOR CLASS (hod + Students)

export const getClassTimetable = async (req, res) => {
  try {
    const { department, year, semester, section } = req.query;

    if (!department || !year || !semester || !section) {
      return res.status(400).json({ message: "Missing query params" });
    }

    const timetable = await Timetable.findOne({
      department,
      year,
      semester: Number(semester),   // 🔥 IMPORTANT
      section,
    });

    return res.status(200).json({
      timetable: timetable || {},
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//GET STAFF TIMETABLE (Faculty Login View)
export const getStaffTimetable = async (req, res) => {
  try {
    const staffId = req.user.facultyId;

    const timetables = await Timetable.find({
      "days.slots.facultyId": staffId,
    });

    const result = [];

    timetables.forEach((table) => {
      table.days.forEach((day) => {
        day.slots.forEach((slot) => {
          if (slot.facultyId.toString() === staffId.toString()) {
            result.push({
              department: table.department,
              year: table.year,
              section: table.section,
              day: day.day,
              time: slot.time,
              subjectId: slot.subjectId,
              subjectName: slot.subjectName,
            });
          }
        });
      });
    });

    return res.status(200).json({
      total: result.length,
      timetable: result,
    });
  } catch (error) {
    console.error("Get Staff Timetable Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
