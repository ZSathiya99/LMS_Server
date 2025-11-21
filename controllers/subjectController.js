import Subject from "../models/subjectModel.js";
import Faculty from "../models/Faculty.js";
import xlsx from "xlsx";
import fs from "fs";
import XLSX from "xlsx";
import AdminAllocation from "../models/adminAllocationModel.js";



// Existing function (for GET)
export const getDepartmentSubjects = async (req, res) => {
  try {
    const { department } = req.params;

    const subjects = await Subject.find({ department }).select("code subject");
    const faculty = await Faculty.find({ department }).select(
      "profileImg firstName lastName salutation email department"
    );

    res.status(200).json({ subjects, faculty });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// 📦 Upload Subjects from Excel
export const uploadSubjectsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No Excel file uploaded" });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let inserted = [];
    for (const row of sheetData) {
      const department = row.Department?.trim();
      const code = row["Code"]?.toString().trim();       // FIXED
      const subject = row["Subject"]?.trim();            // FIXED

      if (!department || !code || !subject) continue;

      const existing = await Subject.findOne({ code, department });
      if (existing) continue;

      const newSubject = new Subject({ code, subject, department });
      await newSubject.save();
      inserted.push(newSubject);
    }

    res.status(201).json({
      message: "Subjects uploaded successfully",
      count: inserted.length,
      subjects: inserted,
    });

  } catch (error) {
    console.error("Excel Upload Error:", error);
    res.status(500).json({ message: error.message });
  }
};




export const getSubjectsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    const departmentMap = {
      "CSE": "Computer Science and Engineering (CSE)",
      "ECE": "Electronics and Communication Engineering (ECE)",
      "EEE": "Electrical & Electronics Engineering (EEE)",
      "IT": "Information Technology (IT)",
      "MECH": "Mechanical Engineering (MECH)",
      "CIVIL": "Civil Engineering (CIVIL)",
      "AI&DS": "Artificial Intelligence & Data Science (AI&DS)",
      "CSBS": "Computer Science and Business Systems (CSBS)"
    };

    // Convert short → full name for subjects
    const fullDeptName = departmentMap[department] || department;

    // 🔹 Subjects are stored using full department name
    const subjects = await Subject.find({ department: fullDeptName })
      .select("code subject");

    // 🔹 Faculty are stored using short department name
    const faculty = await Faculty.find({ department })
      .select("salutation firstName lastName email department");

    if (!subjects.length && !faculty.length) {
      return res.status(404).json({ message: "No data found for this department" });
    }

    res.status(200).json({
      subjects,
      faculty
    });

  } catch (error) {
    console.error("Dept fetch error:", error);
    res.status(500).json({ message: error.message });
  }
};



// ✅ New function (for POST)
export const addSubject = async (req, res) => {
  try {
    const { code, subject, department } = req.body;

    if (!code || !subject || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Subject.findOne({ code, department });
    if (existing) {
      return res.status(400).json({ message: "Subject already exists" });
    }

    const newSubject = new Subject({ code, subject, department });
    await newSubject.save();

    res.status(201).json({
      message: "Subject added successfully",
      subject: newSubject,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


