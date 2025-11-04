import Faculty from "../models/Faculty.js";
import xlsx from "xlsx";

// ✅ Add single faculty
export const addFaculty = async (req, res) => {
  try {
    const { employeeId, name, designation, department, email, phone } = req.body;
    const existing = await Faculty.findOne({ employeeId });
    if (existing) return res.status(400).json({ message: "Employee already exists" });

    const faculty = await Faculty.create({
      employeeId,
      name,
      designation,
      department,
      email,
      phone,
    });

    res.status(201).json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Multiple upload (Excel or CSV)
export const uploadMultipleFaculty = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Example Excel headers: EmployeeID, Name, Designation, Department, Email, Phone
    const facultyData = sheetData.map((row) => ({
      employeeId: row.EmployeeID?.toString(),
      name: row.Name,
      designation: row.Designation,
      department: row.Department,
      email: row.Email,
      phone: row.Phone?.toString(),
    }));

    await Faculty.insertMany(facultyData);
    res.json({ message: "Faculty data uploaded successfully" });
  } catch (error) {
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

    const cleanDept = department.replace(/[^a-zA-Z ]/g, "").trim();

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

    const result = {
      Professors: 0,
      "Associate Professors": 0,
      "Assistant Professors": 0,
    };

    data.forEach((item) => {
      const cleanedDesig = item._id.replace(/[^a-zA-Z ]/g, "").trim().toLowerCase();
      if (cleanedDesig.includes("assistant")) result["Assistant Professors"] += item.count;
      else if (cleanedDesig.includes("associate")) result["Associate Professors"] += item.count;
      else if (cleanedDesig.includes("professor")) result["Professors"] += item.count;
    });

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



// ✅ Dashboard stats (Dean/HOD, Professor, Associate & Assistant)
export const getDashboardStats = async (req, res) => {
  try {
    const total = await Faculty.countDocuments();
    const deansHods = await Faculty.countDocuments({
      designation: { $regex: /(Dean|HOD)/i },
    });
    const professors = await Faculty.countDocuments({
      designation: { $regex: /Professor/i },
    });
    const associateAssistant = await Faculty.countDocuments({
      designation: { $regex: /(Associate|Assistant)/i },
    });

    res.json({
      totalFaculty: total,
      deansAndHods: deansHods,
      professors,
      associateAssistant,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
