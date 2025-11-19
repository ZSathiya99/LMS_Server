import Faculty from "../models/Faculty.js";
import xlsx from "xlsx";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const normalizeKey = (key) =>
  key
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "") // remove spaces
    .replace(/[_-]/g, ""); // remove underscores/dashes

// Flexible getter with normalized keys
const getNorm = (normalized, ...variants) => {
  for (const v of variants) {
    if (normalized[v] !== undefined && normalized[v] !== null && normalized[v] !== "") return normalized[v];
  }
  return undefined;
};

// ======================================================
// ✅ ADD FACULTY (Manual Add)
// ======================================================
export const addFaculty = async (req, res) => {
  try {
    const {
      salutation,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      email,
      mobileNumber,
      qualification,
      workType,
      employeeId,
      joiningDate,
      jobTitle,
      designation,
      reportingManager,
      department,
      noticePeriod,
      role,
      password
    } = req.body;

    if (!email || !password || !firstName || !lastName || !employeeId) {
      return res.status(400).json({
        message: "Email, password, firstName, lastName & employeeId required",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newFaculty = new Faculty({
      salutation,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      email,
      mobileNumber,
      qualification,
      workType,
      employeeId,
      joiningDate,
      jobTitle,
      designation,
      reportingManager,
      department,
      noticePeriod,
      role: role || "faculty",
      password: hashedPassword,
    });

    await newFaculty.save();

    res.status(201).json({
      message: "Faculty added successfully",
      faculty: newFaculty,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ======================================================
// ✅ UPDATE FACULTY
// ======================================================
export const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.body.password) {
      updateData.password = await bcrypt.hash(req.body.password, 10);
    }

    if (req.files) {
      updateData.documents = {
        markSheet: req.files?.markSheet?.[0]?.path,
        experienceCertificate: req.files?.experienceCertificate?.[0]?.path,
        degreeCertificate: req.files?.degreeCertificate?.[0]?.path,
      };
    }

    const faculty = await Faculty.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty updated successfully", faculty });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ======================================================
// ✅ DELETE FACULTY
// ======================================================
export const deleteFaculty = async (req, res) => {
  try {
    const { id } = req.params;

    const faculty = await Faculty.findByIdAndDelete(id);

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.json({ message: "Faculty deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ======================================================
// ✅ BULK UPLOAD (EXCEL)
// ======================================================
// make sure normalizeKey helper exists earlier in the file if you're using it
// const normalizeKey = (key) => key.toString().trim().toLowerCase().replace(/\s+/g, "").replace(/[_-]/g, "");



export const uploadMultipleFaculty = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: true });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ message: "Excel is empty or malformed" });
    }

    const facultyDocs = [];
    let usersCreated = 0;
    let usersUpdated = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      // Normalize keys from the current row
      const normalized = {};
      Object.keys(row).forEach((k) => {
        normalized[normalizeKey(k)] = row[k];
      });

      // --- Resolve essential fields with many fallbacks ---
      // email
      const email = getNorm(normalized, "email", "mail", "emailaddress", "emailid") 
        || `autogen${Date.now()}${i}@college.edu`;

      // phone
      const phone = getNorm(normalized, "phonenumber", "phone", "mobile", "mobilenumber") 
        || ("9" + Math.floor(100000000 + Math.random() * 900000000));

      // employee id
      const employeeId = getNorm(normalized, "employeeid", "empid", "employeeidnumber") 
        || `EMP${1000 + i}`;

      // password (ensure string)
      const rawPwd = String(getNorm(normalized, "password", "pwd") || "123456");
      // hash for faculty password storage
      let hashedPassword;
      try {
        hashedPassword = await bcrypt.hash(rawPwd, 10);
      } catch (err) {
        // fallback if something weird happens
        hashedPassword = await bcrypt.hash("123456", 10);
      }

      // Name splitting (allow firstname/lastname or Name)
      const nameFromCols = getNorm(normalized, "name", "fullname");
      const firstName = getNorm(normalized, "firstname", "first") || (nameFromCols ? nameFromCols.split(" ")[0] : `User${i}`);
      const lastName = getNorm(normalized, "lastname", "last") || (nameFromCols ? nameFromCols.split(" ").slice(1).join(" ") : `Auto${i}`);

      // Other fields (safe fallbacks)
      const salutation = getNorm(normalized, "salutation") || "Mr.";
      const gender = getNorm(normalized, "gender") || "";
      const dateOfBirth = getNorm(normalized, "dateofbirth") || null;
      const qualification = getNorm(normalized, "qualification") || "";
      const workType = getNorm(normalized, "worktype") || "";
      const joiningDate = getNorm(normalized, "joiningdate") || null;
      const jobTitle = getNorm(normalized, "jobtitle") || "";
      const designation = getNorm(normalized, "designation") || "";
      const reportingManager = getNorm(normalized, "reportingmanager") || "";
      const department = getNorm(normalized, "department", "dept") || "";
      const noticePeriod = getNorm(normalized, "noticeperiod") || "";
      const role = getNorm(normalized, "role") || "faculty";

      // Build faculty doc
      const facultyDoc = {
        salutation,
        firstName,
        lastName,
        gender,
        dateOfBirth,
        email,
        mobileNumber: String(phone),
        password: hashedPassword, // hashed
        qualification,
        workType,
        employeeId: String(employeeId),
        joiningDate,
        jobTitle,
        designation,
        reportingManager,
        department,
        noticePeriod,
        role,
      };

      facultyDocs.push(facultyDoc);

      // ------------------
      // Create or update User record for login
      // ------------------
      // User model's pre-save will hash password, so send raw password here
      // Use upsert logic: if user exists, update role & name & password (if provided)
      try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
          // update selective fields (don't overwrite with empty values)
          const userUpdate = {};
          if (firstName || lastName) userUpdate.name = `${firstName} ${lastName}`.trim();
          if (role) userUpdate.role = role;
          if (rawPwd) userUpdate.password = rawPwd; // will be hashed by User pre-save if updated via save()

          // Save update safely
          // If we set password, use save() to allow pre-save hashing
          if (userUpdate.password) {
            existingUser.name = userUpdate.name || existingUser.name;
            existingUser.role = userUpdate.role || existingUser.role;
            existingUser.password = userUpdate.password;
            await existingUser.save();
            usersUpdated++;
          } else if (Object.keys(userUpdate).length > 0) {
            await User.updateOne({ email }, { $set: userUpdate });
            usersUpdated++;
          }
        } else {
          // Create new user (User model will hash password)
          await User.create({
            name: `${firstName} ${lastName}`.trim() || email,
            email,
            password: rawPwd, // plain here: model pre-save will hash
            role,
          });
          usersCreated++;
        }
      } catch (uErr) {
        // Log user-level create/update errors but continue processing
        console.error(`User create/update error for row ${i + 1} (email=${email}):`, uErr.message || uErr);
      }
    } // end for rows

    // Insert all faculty docs into Faculty collection.
    // Use insertMany with ordered:false to continue on duplicates/other row errors
    let insertedCount = 0;
    try {
      const result = await Faculty.insertMany(facultyDocs, { ordered: false });
      insertedCount = result.length;
    } catch (insertErr) {
      // If some docs fail (duplicates/validation) insertMany throws — partial success may exist
      console.warn("Partial insert error:", insertErr.message || insertErr);
      // Try to count inserted docs in DB that match this upload by employeeId/email (best-effort)
      // Simpler approach: fetch how many of our employeeIds are present now
      const employeeIds = facultyDocs.map((f) => f.employeeId);
      insertedCount = await Faculty.countDocuments({ employeeId: { $in: employeeIds } });
    }

    return res.status(200).json({
      message: "Faculty + User sync completed",
      insertedFaculty: insertedCount,
      usersCreated,
      usersUpdated,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return res.status(500).json({ message: error.message });
  }
};



// ======================================================
// ✅ GET ALL FACULTY
// ======================================================
export const getAllFaculty = async (req, res) => {
  try {
    const facultyList = await Faculty.find().sort({ firstName: 1 });
    res.json(facultyList);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ======================================================
// ✅ DEPARTMENT-WISE COUNT
// ======================================================
export const getDepartmentWise = async (req, res) => {
  try {
    const result = await Faculty.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
    ]);

    res.json(result);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ======================================================
// ✅ DEPARTMENT-WISE FACULTY CATEGORY
// ======================================================
export const getDepartmentWiseFaculty = async (req, res) => {
  try {
    const { department } = req.params;
    const cleanDept = department.replace(/['"]+/g, "").trim();

    const data = await Faculty.aggregate([
      {
        $match: {
          department: { $regex: new RegExp(`^${cleanDept}$`, "i") },
        },
      },
      {
        $group: {
          _id: "$designation",
          count: { $sum: 1 },
        },
      },
    ]);

    let professor = 0,
      assistant = 0,
      associate = 0;

    data.forEach((d) => {
      const des = (d._id || "").toLowerCase();
      if (des.includes("assistant")) assistant += d.count;
      else if (des.includes("associate")) associate += d.count;
      else if (des.includes("professor")) professor += d.count;
    });

    res.json([
      { Class: "1st", Designation: "Professor", Count: professor },
      { Class: "2nd", Designation: "Assistant Professor", Count: assistant },
      { Class: "3rd", Designation: "Associate Professor", Count: associate },
    ]);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ======================================================
// ✅ DASHBOARD STATS
// ======================================================
export const getDashboardStats = async (req, res) => {
  try {
    const total = await Faculty.countDocuments();

    const agg = await Faculty.aggregate([
      {
        $addFields: {
          des: { $toLower: "$designation" },
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $regexMatch: { input: "$des", regex: "hod|dean" } },
              "deanHod",
              {
                $cond: [
                  { $regexMatch: { input: "$des", regex: "assistant" } },
                  "assistant",
                  {
                    $cond: [
                      { $regexMatch: { input: "$des", regex: "associate" } },
                      "associate",
                      {
                        $cond: [
                          { $regexMatch: { input: "$des", regex: "professor" } },
                          "professor",
                          "other",
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const stats = agg.reduce((a, b) => {
      a[b._id] = b.count;
      return a;
    }, {});

    res.json({
      totalFaculty: total,
      deansAndHods: stats.deanHod || 0,
      professors: stats.professor || 0,
      associateAssistant: (stats.associate || 0) + (stats.assistant || 0),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
