import Student from "../models/Student.js";
import xlsx from "xlsx";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// ----------------------------------------------
// Helpers
// ----------------------------------------------
const normalizeKey = (key) =>
  key.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/[_-]/g, "");

const getNorm = (normalized, ...variants) => {
  for (const v of variants) {
    if (
      normalized[v] !== undefined &&
      normalized[v] !== null &&
      normalized[v] !== ""
    )
      return normalized[v];
  }
  return undefined;
};

// ======================================================
// ✅ MANUAL ADD STUDENT (With 5-per-section rule)
// ======================================================
export const addStudent = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      registerNumber,
      rollNumber,
      department,
      year,
      section,
      mobileNumber,
      password,
    } = req.body;

    /* ===============================
       1️⃣ REQUIRED VALIDATION
    =============================== */
    if (!email || !registerNumber || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "email, registerNumber, firstName and lastName are required",
      });
    }

    /* ===============================
       2️⃣ PREVENT DUPLICATES
    =============================== */
    const exists = await Student.findOne({
      $or: [{ email }, { registerNumber }],
    });

    if (exists) {
      return res.status(400).json({
        message:
          "Student with this Email or Register Number already exists",
      });
    }

    /* ===============================
       3️⃣ HANDLE ROLL NUMBER
    =============================== */

    let finalRollNumber = rollNumber
      ? String(rollNumber).trim()
      : "";

    // If not provided → auto generate
    if (!finalRollNumber) {
      const count = await Student.countDocuments({
        department,
        year,
      });

      finalRollNumber = `R${count + 1}`;
    }

    // 🔥 Prevent duplicate rollNumber
    const rollExists = await Student.findOne({
      rollNumber: finalRollNumber,
      department,
      year,
    });

    if (rollExists) {
      return res.status(400).json({
        message: "Roll Number already exists",
      });
    }

    /* ===============================
       4️⃣ HANDLE SECTION (AUTO IF EMPTY)
    =============================== */

    let finalSection = section
      ? String(section).trim()
      : "";

    if (!finalSection) {
      const existing = await Student.find({
        department,
        year,
      });

      const position = existing.length;
      const STUDENTS_PER_SECTION = 70;
      const sectionLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

      const sectionIndex = Math.floor(
        position / STUDENTS_PER_SECTION
      );

      finalSection = sectionLetters[sectionIndex] || "";
    }

    /* ===============================
       5️⃣ HANDLE MOBILE
    =============================== */

    let finalMobile = mobileNumber
      ? String(mobileNumber).trim()
      : "";

    if (!finalMobile) {
      finalMobile =
        "9" +
        Math.floor(
          100000000 + Math.random() * 900000000
        );
    }

    /* ===============================
       6️⃣ PASSWORD HASH
    =============================== */

    const rawPassword = password || "123456";
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    /* ===============================
       7️⃣ CREATE STUDENT
    =============================== */

    const newStudent = await Student.create({
      firstName,
      lastName,
      registerNumber,
      rollNumber: finalRollNumber,
      department,
      year,
      section: finalSection,
      email,
      mobileNumber: finalMobile,
      password: hashedPassword,
    });

    /* ===============================
       8️⃣ CREATE USER LOGIN
    =============================== */

    await User.create({
      name: `${firstName} ${lastName}`,
      email,
      password: rawPassword,
      role: "student",
    });

    res.status(201).json({
      message: "Student added successfully",
      student: newStudent,
    });

  } catch (error) {
    console.log("Add student error:", error);
    res.status(500).json({ message: error.message });
  }
};


// ======================================================
// ✅ UPDATE STUDENT
// ======================================================
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    const student = await Student.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    const user = await User.findOne({ email: student.email });
    if (user) {
      if (req.body.password) user.password = req.body.password;
      if (req.body.firstName || req.body.lastName)
        user.name = `${req.body.firstName || student.firstName} ${req.body.lastName || student.lastName}`;
      await user.save();
    }

    res.json({ message: "Student updated", student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// ✅ DELETE STUDENT
// ======================================================
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await User.deleteOne({ email: student.email });

    res.json({ message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// ✅ UPLOAD MULTIPLE STUDENTS FROM EXCEL
// ======================================================
export const uploadMultipleStudents = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);

    if (!rows.length)
      return res.status(400).json({ message: "Empty Excel" });

    let inserted = 0;
    let updated = 0;

    const STUDENTS_PER_SECTION = 70;
    const sectionLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const students = [];

    /* --------------------------------------------------------
       1️⃣ READ & NORMALIZE
    -------------------------------------------------------- */

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];

      const normalized = {};

      Object.keys(raw).forEach((key) => {
        normalized[key.trim().toLowerCase()] = raw[key];
      });

      const email =
        normalized.email ||
        `student${Date.now()}${i}@college.edu`;

      const registerNumber =
        normalized.registernumber ||
        normalized.regno ||
        `REG${1000 + i}`;

      const firstName =
        normalized.firstname ||
        normalized.first ||
        `User${i}`;

      const lastName =
        normalized.lastname ||
        normalized.last ||
        `Auto${i}`;

      const department = normalized.department || "";
      const year = normalized.year || "";

      let section = normalized.section
        ? String(normalized.section).trim()
        : "";

      /* ✅ FIXED ROLL NUMBER LOGIC */
      let rollNumber = normalized.rollnumber
        ? String(normalized.rollnumber).trim()
        : "";

      if (!rollNumber) {
        const deptCount = await Student.countDocuments({
          department,
          year,
        });

        rollNumber = `R${deptCount + i + 1}`;
      }

      let mobileNumber = normalized.phone || normalized.mobile || "";

      if (!mobileNumber) {
        mobileNumber =
          "9" + Math.floor(100000000 + Math.random() * 900000000);
      }

      const rawPwd = String(normalized.password || "123456");
      const hashedPassword = await bcrypt.hash(rawPwd, 10);

      students.push({
        firstName,
        lastName,
        registerNumber,
        rollNumber,
        department,
        year,
        section,
        email,
        mobileNumber,
        rawPwd,
        hashedPassword,
      });
    }

    /* --------------------------------------------------------
       2️⃣ SORT
    -------------------------------------------------------- */

    students.sort((a, b) =>
      a.firstName.localeCompare(b.firstName)
    );

    /* --------------------------------------------------------
       3️⃣ GROUP BY DEPT + YEAR
    -------------------------------------------------------- */

    const group = {};

    for (const stu of students) {
      const key = `${stu.department}-${stu.year}`;
      if (!group[key]) group[key] = [];
      group[key].push(stu);
    }

    /* --------------------------------------------------------
       4️⃣ AUTO SECTION ALLOCATION
    -------------------------------------------------------- */

    for (const key in group) {
      const [dept, yr] = key.split("-");

      const existing = await Student.find({
        department: dept,
        year: yr,
      });

      const existingCount = existing.length;

      let list = group[key];

      let autoList = list.filter(
        (stu) => !stu.section || stu.section.trim() === ""
      );

      for (let i = 0; i < autoList.length; i++) {
        const globalIndex = existingCount + i;
        const sectionIndex = Math.floor(
          globalIndex / STUDENTS_PER_SECTION
        );

        autoList[i].section =
          sectionLetters[sectionIndex] || "";
      }
    }

    /* --------------------------------------------------------
       5️⃣ INSERT / UPDATE
    -------------------------------------------------------- */

    for (const stu of students) {
      const {
        firstName,
        lastName,
        registerNumber,
        rollNumber,
        department,
        year,
        section,
        email,
        mobileNumber,
        rawPwd,
        hashedPassword,
      } = stu;

      let existingStudent = await Student.findOne({
        $or: [{ registerNumber }, { email }],
      });

      if (existingStudent) {
        await Student.updateOne(
          { _id: existingStudent._id },
          {
            $set: {
              firstName,
              lastName,
              department,
              year,
              section,
              rollNumber,
              mobileNumber,
            },
          }
        );

        updated++;
      } else {
        await Student.create({
          firstName,
          lastName,
          registerNumber,
          rollNumber,
          department,
          year,
          section,
          email,
          mobileNumber,
          password: hashedPassword,
        });

        inserted++;
      }
    }

    /* --------------------------------------------------------
       6️⃣ RESPONSE
    -------------------------------------------------------- */

    res.status(200).json({
      message: "Upload Completed Successfully",
      insertedStudents: inserted,
      updatedStudents: updated,
    });

  } catch (error) {
    console.log("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};


// ======================================================
// GET ALL STUDENTS
// ======================================================
export const getAllStudents = async (req, res) => {
  try {
    const list = await Student.find().sort({ firstName: 1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// DEPARTMENT-WISE COUNT
// ======================================================
export const getStudentDepartmentWise = async (req, res) => {
  try {
    const data = await Student.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// YEAR-WISE COUNT (DEPT PIE)
// ======================================================
export const getStudentsByDeptPie = async (req, res) => {
  try {
    const { department } = req.params;

    const data = await Student.aggregate([
      { $match: { department } },
      { $group: { _id: "$year", count: { $sum: 1 } } },
    ]);

    res.json({
      firstYear: data.find((d) => d._id === "First Year")?.count || 0,
      secondYear: data.find((d) => d._id === "Second Year")?.count || 0,
      thirdYear: data.find((d) => d._id === "Third Year")?.count || 0,
      fourthYear: data.find((d) => d._id === "Fourth Year")?.count || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// DASHBOARD STATS
// ======================================================
export const getStudentDashboard = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();

    const yearwise = await Student.aggregate([
      { $group: { _id: "$year", count: { $sum: 1 } } },
    ]);

    res.json({
      totalStudents,
      yearWise: {
        firstYear: yearwise.find((y) => y._id === "First Year")?.count || 0,
        secondYear: yearwise.find((y) => y._id === "Second Year")?.count || 0,
        thirdYear: yearwise.find((y) => y._id === "Third Year")?.count || 0,
        fourthYear: yearwise.find((y) => y._id === "Fourth Year")?.count || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// FILTER STUDENTS (Dept + Year + Section)
// ======================================================
export const getStudentsFiltered = async (req, res) => {
  try {
    const { department, year, section } = req.query;

    const filter = {};

    if (department) filter.department = department;
    if (year) filter.year = year;

    if (section && section !== "Unallocated") {
      filter.section = section;
    }

    if (section === "Unallocated") {
      filter.$or = [{ section: "" }, { section: null }];
    }

    let students = await Student.find(filter).sort({ firstName: 1 });

    // Convert empty section → Unallocated
    students = students.map((s) => ({
      ...s._doc,
      section: s.section && s.section.trim() !== "" ? s.section : "Unallocated",
    }));

    res.json({
      total: students.length,
      students,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ======================================================
// ✅ HOD DASHBOARD (Dynamic Department from Token)
// ======================================================
export const getDepartmentSummary = async (req, res) => {
  try {
    const hodDept = req.user.department; // department from token

    if (!hodDept) {
      return res
        .status(400)
        .json({ message: "HOD Department missing in token" });
    }

    // Fetch all students of this department
    const students = await Student.find({ department: hodDept }).sort({
      year: 1,
      section: 1,
      firstName: 1,
    });

    const yearsList = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

    const summary = {
      department: hodDept,
      totalStudents: students.length,
      years: [],
    };

    // ALWAYS SHOW THIS ORDER:
    const sectionOrder = ["A", "B", "C", "D", "E", "F", "Unallocated"];

    for (const year of yearsList) {
      const yearStudents = students.filter((s) => s.year === year);

      if (yearStudents.length === 0) {
        summary.years.push({
          year,
          total: 0,
          sections: [],
        });
        continue;
      }

      // Group by section
      const sectionMap = {};

      yearStudents.forEach((s) => {
        const sec =
          s.section && s.section.trim() !== "" ? s.section : "Unallocated";

        if (!sectionMap[sec]) sectionMap[sec] = [];
        sectionMap[sec].push(s);
      });

      // Sorting into A,B,C...Unallocated
      const sortedSections = sectionOrder
        .filter((sec) => sectionMap[sec]) // sections that exist
        .map((sec) => ({
          section: sec,
          count: sectionMap[sec].length,
          students: sectionMap[sec], // FULL student list
        }));

      summary.years.push({
        year,
        total: yearStudents.length,
        sections: sortedSections,
      });
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const swapStudentSection = async (req, res) => {
  try {
    const { studentIds, newSection } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "No students selected" });
    }

    if (!newSection) {
      return res.status(400).json({ message: "New section is required" });
    }

    // 1️⃣ Ensure students exist
    const students = await Student.find({ _id: { $in: studentIds } });

    if (students.length === 0) {
      return res.status(404).json({ message: "No valid students found" });
    }

    // 2️⃣ UPDATE — without checking section limits
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { $set: { section: newSection } },
    );

    res.json({
      message: `Successfully moved ${students.length} students to section ${newSection}`,
      moved: students.length,
      section: newSection,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
