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

    // 🔥 Fixed grid definition
    const TIME_SLOTS = [
      "08:40AM - 09:35AM",
      "09:35AM - 10:30AM",
      "10:30AM - 11:25AM",
      "11:45AM - 12:40PM",
      "01:40PM - 02:30PM",
      "02:30PM - 03:20PM",
      "03:20PM - 04:10PM",
    ];

    const DAYS = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // 🔥 Always create default grid
    const grid = {};

    TIME_SLOTS.forEach((time) => {
      grid[time] = {};
      DAYS.forEach((day) => {
        grid[time][day] = null;
      });
    });

    // 🔥 Now fetch timetable
    const timetable = await Timetable.findOne({
      department,
      year,
      semester: Number(semester),
      section,
    });

    // 🔥 If found → fill grid
    if (timetable) {
      timetable.days.forEach((dayObj) => {
        dayObj.slots.forEach((slot) => {
          if (grid[slot.time]) {
            grid[slot.time][dayObj.day] = {
              subjectId: slot.subjectId,
              subjectName: slot.subjectName,
              facultyId: slot.facultyId,
              facultyName: slot.facultyName,
            };
          }
        });
      });
    }

    // 🔥 Always return grid (even if empty)
    return res.status(200).json(grid);

  } catch (error) {
    console.error("Get Class Timetable Error:", error);
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

    // 🔥 FIXED TIME GRID
    const TIME_SLOTS = [
      "08:40AM - 09:35AM",
      "09:35AM - 10:30AM",
      "10:30AM - 11:25AM",
      "11:45AM - 12:40PM",
      "01:40PM - 02:30PM",
      "02:30PM - 03:20PM",
      "03:20PM - 04:10PM",
    ];

    const DAYS = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    // 🔥 INIT GRID
    const grid = {};

    TIME_SLOTS.forEach((time) => {
      grid[time] = {};
      DAYS.forEach((day) => {
        grid[time][day] = null;
      });
    });

    // 🔥 FILL GRID FROM DB
    timetables.forEach((table) => {
      table.days.forEach((dayObj) => {
        dayObj.slots.forEach((slot) => {
          if (slot.facultyId.toString() === staffId.toString()) {
            if (grid[slot.time]) {
              grid[slot.time][dayObj.day] = {
                department: table.department,
                year: table.year,
                section: table.section,
                subjectId: slot.subjectId,
                subjectName: slot.subjectName,
              };
            }
          }
        });
      });
    });

    return res.status(200).json(grid);

  } catch (error) {
    console.error("Get Staff Timetable Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

