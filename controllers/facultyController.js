import Faculty from "../models/Faculty.js";
import xlsx from "xlsx";

// ✅ Add single faculty

export const addFaculty = async (req, res) => {
  try {
    console.log("Body received:", req.body);
    console.log("Files received:", req.files);

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
      // timeType,
      reportingManager,
      department,
      noticePeriod,
      // user,
    } = req.body;

    // ✅ Create new faculty record
    const faculty = await Faculty.create({
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
      // timeType,
      reportingManager,
      department,
      noticePeriod,
      // user,
      documents: {
        markSheet: req.files?.markSheet?.[0]?.path || null,
        experienceCertificate: req.files?.experienceCertificate?.[0]?.path || null,
        degreeCertificate: req.files?.degreeCertificate?.[0]?.path || null,
      },
    });

    res.status(201).json({ message: "Faculty added successfully", faculty });
  } catch (error) {
    console.error("❌ Error in addFaculty:", error);
    res.status(500).json({ message: error.message });
  }
};


// ✅ Multiple upload (Excel or CSV)

export const uploadMultipleFaculty = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 🧠 Convert Excel rows into Faculty schema format
    const facultyData = sheetData.map((row) => {
      // Split full name into first and last name safely
      let firstName = "";
      let lastName = "";

      if (row.Name) {
        const parts = row.Name.trim().split(" ");
        firstName = parts[0];
        lastName = parts.slice(1).join(" ") || parts[0] || "N/A";
      } else {
        firstName = "Unknown";
        lastName = "Unknown";
      }

      return {
        salutation: row.Salutation || "Mr.",
        firstName,
        lastName,
        gender: row.Gender || "Not Specified",
        dateOfBirth: row.DateOfBirth || null,
        email: row.Email || "",
        mobileNumber: row.Phone?.toString() || "0000000000",
        qualification: row.Qualification || "",
        workType: row.WorkType || "Full-Time",
        employeeId: row.EmployeeID?.toString() || "",
        joiningDate: row.JoiningDate || "",
        jobTitle: row.JobTitle || row.Designation || "",
        designation: row.Designation || "",
        timeType: row.TimeType || "",
        reportingManager: row.ReportingManager || "",
        department: row.Department || "",
        noticePeriod: row.NoticePeriod || "",
      };
    });

    // 🚀 Bulk insert into MongoDB
    await Faculty.insertMany(facultyData);

    res.status(200).json({
      message: "Faculty data uploaded successfully",
      insertedCount: facultyData.length,
    });
  } catch (error) {
    console.error("❌ Error in uploadMultipleFaculty:", error);
    res.status(500).json({ message: error.message });
  }
};


// ✅ Get all faculty
export const getAllFaculty = async (req, res) => {
  try {
    const facultyList = await Faculty.find().sort({ name: 1 });
    res.json(facultyList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Department-wise count
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

// GET /api/faculty/department-wise/:department
export const getDepartmentWiseFaculty = async (req, res) => {
  try {
    const { department } = req.params;

    if (!department || typeof department !== "string") {
      return res.status(400).json({ message: "Invalid or missing department parameter" });
    }

    // 🧹 Clean and normalize department name
    const cleanDept = department.replace(/['"]+/g, "").trim();

    // 🧮 Aggregate only selected department
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

    // 🧾 Initialize counters
    let professorCount = 0;
    let assistantCount = 0;
    let associateCount = 0;

    // 🧠 Categorize based on designation
    data.forEach((item) => {
      const desig = (item._id || "").toLowerCase();

      if (desig.includes("assistant")) assistantCount += item.count;
      else if (desig.includes("associate")) associateCount += item.count;
      else if (desig.includes("professor")) professorCount += item.count;
    });

    // ✅ Format response
    const result = [
      { Class: "1st", Designation: "Professor", Count: professorCount },
      { Class: "2nd", Designation: "Assistant Professor", Count: assistantCount },
      { Class: "3rd", Designation: "Associate Professor", Count: associateCount },
    ];

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error in getDepartmentWiseFaculty:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};






// ✅ Dashboard stats (Dean/HOD, Professor, Associate & Assistant)
export const getDashboardStats = async (req, res) => {
  try {
    const total = await Faculty.countDocuments();

    // classify every record only once
    const agg = await Faculty.aggregate([
      {
        $project: {
          designation: { $ifNull: ["$designation", ""] }
        }
      },
      {
        $addFields: { desigLower: { $toLower: "$designation" } }
      },
      {
        $addFields: {
          category: {
            $switch: {
              branches: [
                {
                  case: { $regexMatch: { input: "$desigLower", regex: "hod|dean" } },
                  then: "deanHod"
                },
                {
                  case: { $regexMatch: { input: "$desigLower", regex: "assistant" } },
                  then: "assistant"
                },
                {
                  case: { $regexMatch: { input: "$desigLower", regex: "associate" } },
                  then: "associate"
                },
                {
                  case: { $regexMatch: { input: "$desigLower", regex: "professor" } },
                  then: "professor"
                }
              ],
              default: "other"
            }
          }
        }
      },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const counts = agg.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const deansAndHods = counts.deanHod || 0;
    const professors = counts.professor || 0;
    const associateCount = counts.associate || 0;
    const assistantCount = counts.assistant || 0;
    const associateAssistant = associateCount + assistantCount;

    res.json({
      totalFaculty: total,
      deansAndHods,
      professors,
      associateAssistant
    });
  } catch (error) {
    console.error("❌ Error in getDashboardStats:", error);
    res.status(500).json({ message: error.message });
  }
};




