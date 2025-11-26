import Student from "../models/Student.js";
import xlsx from "xlsx";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// ----------------------------------------------
// Normalizer Helpers
// ----------------------------------------------
const normalizeKey = (key) =>
  key.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/[_-]/g, "");

const getNorm = (normalized, ...variants) => {
  for (const v of variants) {
    if (normalized[v] !== undefined && normalized[v] !== null && normalized[v] !== "")
      return normalized[v];
  }
  return undefined;
};

// ======================================================
// ✅ ADD STUDENT (Manual Add)
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

    if (!email || !registerNumber || !firstName || !lastName) {
      return res.status(400).json({
        message: "email, registerNumber, firstName, lastName required",
      });
    }

    const hashedPassword = await bcrypt.hash(password || "123456", 10);

    const newStudent = new Student({
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

    await newStudent.save();

    // Create parallel USER login
    await User.create({
      name: `${firstName} ${lastName}`,
      email,
      password: password || "123456",
      role: "student",
    });

    res.status(201).json({
      message: "Student added",
      student: newStudent,
    });
  } catch (error) {
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

    // Sync user
    const user = await User.findOne({ email: student.email });
    if (user) {
      if (req.body.password) user.password = req.body.password;
      if (req.body.firstName || req.body.lastName)
        user.name = `${req.body.firstName || student.firstName} ${
          req.body.lastName || student.lastName
        }`;
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
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);

    if (!rows.length) return res.status(400).json({ message: "Empty Excel" });

    let students = [];
    let usersCreated = 0;
    let usersUpdated = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];

      const normalized = {};
      Object.keys(raw).forEach((k) => {
        normalized[normalizeKey(k)] = raw[k];
      });

      const email =
        getNorm(normalized, "email", "mail") ||
        `student${Date.now()}${i}@college.edu`;

      const registerNumber =
        getNorm(normalized, "regno", "registernumber") || `REG${1000 + i}`;

      const rollNumber = getNorm(normalized, "rollno", "roll") || "";

      const firstName =
        getNorm(normalized, "firstname", "first") ||
        getNorm(normalized, "name")?.split(" ")[0] ||
        `User${i}`;

      const lastName =
        getNorm(normalized, "lastname", "last") ||
        getNorm(normalized, "name")?.split(" ").slice(1).join(" ") ||
        `Auto${i}`;

      const department = getNorm(normalized, "department", "dept") || "";
      const year = getNorm(normalized, "year") || "";
      const section = getNorm(normalized, "section") || "";

      const rawPwd = String(getNorm(normalized, "password") || "123456");

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
        mobileNumber: getNorm(normalized, "phone", "mobile") || "",
        password: hashedPassword,
      });

      // USER LOGIN SYNC
      const existing = await User.findOne({ email });

      if (existing) {
        existing.name = `${firstName} ${lastName}`;
        existing.role = "student";
        existing.password = rawPwd;
        await existing.save();
        usersUpdated++;
      } else {
        await User.create({
          name: `${firstName} ${lastName}`,
          email,
          password: rawPwd,
          role: "student",
        });
        usersCreated++;
      }
    }

    // Insert students
    let insertedCount = 0;
    try {
      const result = await Student.insertMany(students, { ordered: false });
      insertedCount = result.length;
    } catch (err) {
      const regNos = students.map((s) => s.registerNumber);
      insertedCount = await Student.countDocuments({
        registerNumber: { $in: regNos },
      });
    }

    res.status(200).json({
      message: "Students uploaded",
      insertedStudents: insertedCount,
      usersCreated,
      usersUpdated,
    });
  } catch (error) {
    console.log("Upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
// ✅ GET ALL STUDENTS
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
// ✅ DEPARTMENT-WISE COUNT
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
// GET /api/students/department-wise/:department
export const getStudentsByDeptPie = async (req, res) => {
  try {
    const { department } = req.params;

    const data = await Student.aggregate([
      { 
        $match: { 
          department: { $regex: new RegExp(`^${department}$`, "i") }
        } 
      },
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 }
        }
      }
    ]);

    let pie = {
      firstYear: data.find(d => d._id == "First Year")?.count || 0,
      secondYear: data.find(d => d._id == "Second Year")?.count || 0,
      thirdYear: data.find(d => d._id == "Third Year")?.count || 0,
      fourthYear: data.find(d => d._id == "Fourth Year")?.count || 0,
    };

    res.json(pie);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ======================================================
// ✅ DASHBOARD STATS
// ======================================================
// GET /api/students/dashboard
export const getStudentDashboard = async (req, res) => {
  try {
    // total count
    const totalStudents = await Student.countDocuments();

    // year-wise count
    const yearwise = await Student.aggregate([
      {
        $group: {
          _id: "$year",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalStudents,
      yearWise: {
        firstYear: yearwise.find(y => y._id === "First Year")?.count || 0,
        secondYear: yearwise.find(y => y._id === "Second Year")?.count || 0,
        thirdYear: yearwise.find(y => y._id === "Third Year")?.count || 0,
        fourthYear: yearwise.find(y => y._id === "Fourth Year")?.count || 0,
      }
    };

    res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

