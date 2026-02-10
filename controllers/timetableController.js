import Timetable from "../models/Timetable.js";

/* =========================================================
   CONSTANTS (Single Source of Truth)
========================================================= */

const PERIODS = [
  { period: 1, time: "08:40AM - 09:35AM" },
  { period: 2, time: "09:35AM - 10:25AM" },
  { period: 3, time: "10:25AM - 11:15AM" },
  { period: 4, time: "11:35AM - 12:25PM" },
  { period: 5, time: "12:25PM - 01:15PM" },
  { period: 6, time: "02:30PM - 03:20PM" },
  { period: 7, time: "03:20PM - 04:10PM" },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/* =========================================================
   CREATE / UPDATE TIMETABLE SLOT (HOD)
========================================================= */

export const saveTimetableSlot = async (req, res) => {
  try {
    const {
      department,
      year,
      semester,
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
      !semester ||
      !section ||
      !day ||
      !time ||
      !subjectId ||
      !facultyId
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    /* 🔥 FACULTY TIME CONFLICT CHECK (ALL SECTIONS) */
    const conflict = await Timetable.findOne({
      department,
      year,
      semester,
      days: {
        $elemMatch: {
          day,
          slots: {
            $elemMatch: { time, facultyId },
          },
        },
      },
    });

    if (conflict) {
      return res.status(400).json({
        message: "Faculty already allocated at this time",
      });
    }

    /* 🔥 FIND / CREATE TIMETABLE */
    let timetable = await Timetable.findOne({
      department,
      year,
      semester,
      section,
    });

    if (!timetable) {
      timetable = new Timetable({
        department,
        year,
        semester,
        section,
        days: [],
      });
    }

    /* 🔥 FIND DAY INDEX */
    let dayIndex = timetable.days.findIndex((d) => d.day === day);

    if (dayIndex === -1) {
      timetable.days.push({ day, slots: [] });
      dayIndex = timetable.days.length - 1;
    }

    /* 🔥 REPLACE SLOT IF SAME TIME EXISTS */
    timetable.days[dayIndex].slots =
      timetable.days[dayIndex].slots.filter((s) => s.time !== time);

    /* 🔥 ADD SLOT */
    timetable.days[dayIndex].slots.push({
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

/* =========================================================
   UPDATE TIMETABLE SLOT
========================================================= */

export const updateTimetableSlot = async (req, res) => {
  try {
    const {
      department,
      year,
      semester,
      section,
      day,
      oldTime,
      newTime,
      subjectId,
      subjectName,
      facultyId,
      facultyName,
    } = req.body;

    if (
      !department ||
      !year ||
      !semester ||
      !section ||
      !day ||
      !oldTime ||
      !newTime ||
      !subjectId ||
      !facultyId
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    /* 🔥 FACULTY CONFLICT CHECK FOR NEW TIME */
    const conflict = await Timetable.findOne({
      department,
      year,
      semester,
      days: {
        $elemMatch: {
          day,
          slots: {
            $elemMatch: {
              time: newTime,
              facultyId,
            },
          },
        },
      },
    });

    if (conflict) {
      return res.status(400).json({
        message: "Faculty already allocated at new time",
      });
    }

    const timetable = await Timetable.findOne({
      department,
      year,
      semester,
      section,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    const dayIndex = timetable.days.findIndex((d) => d.day === day);
    if (dayIndex === -1) {
      return res.status(404).json({ message: "Day not found" });
    }

    timetable.days[dayIndex].slots =
      timetable.days[dayIndex].slots.filter((s) => s.time !== oldTime);

    timetable.days[dayIndex].slots.push({
      time: newTime,
      subjectId,
      subjectName,
      facultyId,
      facultyName,
    });

    timetable.markModified("days");
    await timetable.save();

    return res.status(200).json({
      message: "Timetable slot updated successfully",
      timetable,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   DELETE TIMETABLE SLOT
========================================================= */

export const deleteTimetableSlot = async (req, res) => {
  try {
    const { department, year, semester, section, day, time } = req.body;

    if (!department || !year || !semester || !section || !day || !time) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const timetable = await Timetable.findOne({
      department,
      year,
      semester,
      section,
    });

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    const dayIndex = timetable.days.findIndex((d) => d.day === day);
    if (dayIndex === -1) {
      return res.status(404).json({ message: "Day not found" });
    }

    const before = timetable.days[dayIndex].slots.length;

    timetable.days[dayIndex].slots =
      timetable.days[dayIndex].slots.filter((s) => s.time !== time);

    if (before === timetable.days[dayIndex].slots.length) {
      return res.status(404).json({ message: "Slot not found" });
    }

    timetable.markModified("days");
    await timetable.save();

    return res.status(200).json({
      message: "Timetable slot deleted successfully",
      timetable,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   GET CLASS TIMETABLE (SCREEN VIEW)
========================================================= */

export const getClassTimetable = async (req, res) => {
  try {
    const { department, year, semester, section } = req.query;

    if (!department || !year || !semester || !section) {
      return res.status(400).json({ message: "Missing query params" });
    }

    const rows = DAYS.map((day) => ({
      day,
      periods: PERIODS.map(() => null),
    }));

    const timetable = await Timetable.findOne({
      department,
      year,
      semester: Number(semester),
      section,
    });

    if (timetable) {
      timetable.days.forEach((dayObj) => {
        const row = rows.find((r) => r.day === dayObj.day);
        if (!row) return;

        dayObj.slots.forEach((slot) => {
          const index = PERIODS.findIndex((p) => p.time === slot.time);
          if (index !== -1) {
            row.periods[index] = {
              subjectId: slot.subjectId,
              subjectName: slot.subjectName,
              facultyName: slot.facultyName,
            };
          }
        });
      });
    }

    return res.status(200).json({
      department,
      year,
      semester,
      section,
      headers: PERIODS,
      rows,
      breaks: {
        teaBreak: "11:15AM - 11:35AM",
        lunchBreak: "01:15PM - 02:00PM",
        activityHour: "02:00PM - 02:30PM",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   GET STAFF TIMETABLE (FACULTY VIEW)
========================================================= */

export const getStaffTimetable = async (req, res) => {
  try {
    const staffId = req.user.facultyId;

    const timetables = await Timetable.find({
      "days.slots.facultyId": staffId,
    });

    const grid = {};

    PERIODS.forEach((p) => {
      grid[p.time] = {};
      DAYS.forEach((d) => {
        grid[p.time][d] = null;
      });
    });

    timetables.forEach((table) => {
      table.days.forEach((dayObj) => {
        dayObj.slots.forEach((slot) => {
          if (slot.facultyId === staffId && grid[slot.time]) {
            grid[slot.time][dayObj.day] = {
              department: table.department,
              year: table.year,
              section: table.section,
              subjectName: slot.subjectName,
            };
          }
        });
      });
    });

    return res.status(200).json(grid);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
