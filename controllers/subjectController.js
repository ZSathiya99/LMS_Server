import Subject from "../models/subjectModel.js";
import Faculty from "../models/Faculty.js";
import xlsx from "xlsx";
import fs from "fs";
import XLSX from "xlsx";



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
    // 🧩 1️⃣ File check
    if (!req.file) {
      return res.status(400).json({ message: "No Excel file uploaded" });
    }

    // 🧩 2️⃣ Read the Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 🧩 3️⃣ Validate and process each row
    let inserted = [];
    for (const row of sheetData) {
      const department = row.Department?.trim();
      const code = row["Subject Code"]?.toString().trim();
      const subject = row["Subject Name"]?.trim();

      if (!department || !code || !subject) continue;

      // Check if subject already exists in this department
      const existing = await Subject.findOne({ code, department });
      if (existing) continue;

      const newSubject = new Subject({ code, subject, department });
      await newSubject.save();
      inserted.push(newSubject);
    }

    // 🧩 4️⃣ Send response
    res.status(201).json({
      message: "Subjects uploaded successfully",
      count: inserted.length,
      subjects: inserted,
    });
  } catch (error) {
    console.error("Excel Upload Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getSubjectsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    const subjects = await Subject.find({ department }).select("code subject");
    const faculty = await Faculty.find({ department }).select(
      "profileImg salutation firstName lastName email department"
    );

    if (!subjects.length && !faculty.length) {
      return res.status(404).json({ message: "No data found for this department" });
    }

    res.status(200).json({ subjects, faculty });
  } catch (error) {
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
