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
// ✅ ADD STUDENT (Manual Add) with AUTO SECTION ASSIGN
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

    // -----------------------------
    // 1️⃣ VALIDATION
    // -----------------------------
    if (!email || !registerNumber || !firstName || !lastName) {
      return res.status(400).json({
        message: "email, registerNumber, firstName, lastName are required",
      });
    }

    // -----------------------------
    // 2️⃣ PREVENT DUPLICATES
    // -----------------------------
    const exists = await Student.findOne({
      $or: [{ email }, { registerNumber }]
    });

    if (exists) {
      return res.status(400).json({
        message: "Student with this Email or Register Number already exists",
      });
    }

    // -----------------------------
    // 3️⃣ AUTO ROLL NUMBER (if empty)
    // -----------------------------
    let finalRollNumber = rollNumber;
    if (!finalRollNumber || finalRollNumber.trim() === "") {
      const countDept = await Student.countDocuments({ department });
      finalRollNumber = `R${countDept + 1}`;
    }

    // -----------------------------
    // 4️⃣ AUTO SECTION (only if empty)
    // -----------------------------
    let finalSection = section;
    if (!finalSection || finalSection.trim() === "") {
      const sectionLetters = ["A","B","C","D","E","F","G","H","I","J"];
      const countDept = await Student.countDocuments({ department });
      const secIndex = Math.floor(countDept / 10); // 10 per section
      finalSection = sectionLetters[secIndex] || "Z";
    }

    // -----------------------------
    // 5️⃣ AUTO MOBILE NUMBER (if empty)
    // -----------------------------
    let finalMobile = mobileNumber;
    if (!finalMobile || finalMobile.trim() === "") {
      finalMobile = "9" + Math.floor(100000000 + Math.random() * 900000000);
    }

    // -----------------------------
    // 6️⃣ HASH PASSWORD
    // -----------------------------
    const hashedPassword = await bcrypt.hash(password || "123456", 10);

    // -----------------------------
    // 7️⃣ CREATE STUDENT DOCUMENT
    // -----------------------------
    const newStudent = new Student({
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

    await newStudent.save();

    // -----------------------------
    // 8️⃣ CREATE USER LOGIN
    // -----------------------------
    await User.create({
      name: `${firstName} ${lastName}`,
      email,
      password: password || "123456",
      role: "student",
    });

    // -----------------------------
    // 9️⃣ RESPONSE
    // -----------------------------
    res.status(201).json({
      message: "Student added successfully",
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
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);

    if (!rows.length)
      return res.status(400).json({ message: "Empty Excel" });

    let inserted = 0;
    let updated = 0;

    let students = [];

    // -----------------------------------------------------
    // 1️⃣ READ EACH EXCEL ROW AND BUILD NORMALIZED STUDENT OBJECT
    // -----------------------------------------------------
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];

      // Normalize keys
      const normalized = {};
      Object.keys(raw).forEach((k) => {
        normalized[normalizeKey(k)] = raw[k];
      });

      const email =
        getNorm(normalized, "email", "mail") ||
        `student${Date.now()}${i}@college.edu`;

      const registerNumber =
        getNorm(normalized, "regno", "registernumber") ||
        `REG${1000 + i}`;

      const firstName =
        getNorm(normalized, "firstname", "first") ||
        `User${i}`;

      const lastName =
        getNorm(normalized, "lastname", "last") ||
        `Auto${i}`;

      const department = getNorm(normalized, "department", "dept") || "";
      const year = getNorm(normalized, "year") || "";

      // ⭐ SECTION (Excel may give " ", "  ", undefined etc.)
      let section = (getNorm(normalized, "section") || "").trim();

      // ⭐ AUTO ROLL NUMBER
      let rollNumber = getNorm(normalized, "rollno", "roll") || "";
      if (!rollNumber.trim()) {
        const deptCount = await Student.countDocuments({ department });
        rollNumber = `R${deptCount + 1}`;
      }

      // ⭐ AUTO MOBILE NUMBER
      let mobileNumber = getNorm(normalized, "phone", "mobile") || "";
      if (!mobileNumber.trim()) {
        mobileNumber =
          "9" + Math.floor(100000000 + Math.random() * 900000000);
      }

      // ⭐ PASSWORD
      const rawPwd = String(
        getNorm(normalized, "password") || "123456"
      );
      const hashedPassword = await bcrypt.hash(rawPwd, 10);

      // STORE TEMP OBJECT
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

    // -----------------------------------------------------
    // 2️⃣ SORT STUDENTS ALPHABETICALLY
    // -----------------------------------------------------
    students.sort((a, b) => a.firstName.localeCompare(b.firstName));

    // -----------------------------------------------------
    // 3️⃣ AUTO ASSIGN SECTION ONLY FOR EMPTY VALUES (FIXED)
    // -----------------------------------------------------
    const sectionLetters = ["A","B","C","D","E","F","G","H"];

    const deptGroups = {};

    // GROUP BY DEPARTMENT
    students.forEach((stu) => {
      if (!deptGroups[stu.department]) deptGroups[stu.department] = [];
      deptGroups[stu.department].push(stu);
    });

    // FIXED AUTO-SECTION ALLOCATION
    for (const dept in deptGroups) {
      let count = 0;

      deptGroups[dept].forEach((stu) => {
        if (!stu.section || stu.section.trim() === "") {
          const secIndex = Math.floor(count / 10);
          stu.section = sectionLetters[secIndex] || "Z";
          count++;
        }
      });
    }

    // -----------------------------------------------------
    // 4️⃣ INSERT / UPDATE STUDENTS + USER SYNC
    // -----------------------------------------------------
    for (const stu of students) {
      const {
        firstName, lastName, registerNumber, rollNumber,
        department, year, section, email, mobileNumber,
        rawPwd, hashedPassword
      } = stu;

      // CHECK IF STUDENT EXISTS
      let existingStudent = await Student.findOne({
        $or: [{ registerNumber }, { email }],
      });

      if (existingStudent) {
        // ⭐ UPDATE STUDENT
        await Student.updateOne(
          { _id: existingStudent._id },
          {
            $set: {
              firstName,
              lastName,
              department,
              year,
              section: section || existingStudent.section,
              rollNumber,
              mobileNumber,
            },
          }
        );

        // ⭐ UPDATE USER FOR LOGIN
        let existingUser = await User.findOne({ email });

        if (existingUser) {
          existingUser.name = `${firstName} ${lastName}`;
          existingUser.password = rawPwd;
          existingUser.role = "student";
          await existingUser.save();
        }

        updated++;
      } else {
        // ⭐ INSERT NEW STUDENT
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

        // ⭐ USER: CREATE OR UPDATE
        let existingUser = await User.findOne({ email });

        if (!existingUser) {
          await User.create({
            name: `${firstName} ${lastName}`,
            email,
            password: rawPwd,
            role: "student",
          });
        } else {
          existingUser.name = `${firstName} ${lastName}`;
          existingUser.password = rawPwd;
          existingUser.role = "student";
          await existingUser.save();
        }

        inserted++;
      }
    }

    // -----------------------------------------------------
    // 5️⃣ DONE
    // -----------------------------------------------------
    res.status(200).json({
      message: "Upload Completed Successfully (Insert + Update + Auto Section)",
      insertedStudents: inserted,
      updatedStudents: updated,
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

