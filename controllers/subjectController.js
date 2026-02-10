import Subject from "../models/SubjectModel.js";
import Faculty from "../models/Faculty.js";
import xlsx from "xlsx";
import fs from "fs";
import XLSX from "xlsx";
// import AdminAllocation from "../models/AdminAllocationModel.js";





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

    const sheetData = XLSX.utils.sheet_to_json(
      workbook.Sheets[sheetName],
      { defval: "" } // prevents undefined values
    );

    if (!sheetData.length) {
      return res.status(400).json({ message: "Excel file is empty" });
    }

    const insertedSubjects = [];
    const duplicateSubjects = [];

    for (const row of sheetData) {

      // ✅ MATCH YOUR LOWERCASE HEADERS
      const department = row.department?.toString().trim();
      const code = row.code?.toString().trim();
      const subject = row.subject?.toString().trim();

      if (!department || !code || !subject) continue;

      const existing = await Subject.findOne({
        code,
        department,
      });

      if (existing) {
        duplicateSubjects.push({
          department,
          code,
          subject,
          reason: "Already subject added",
        });
        continue;
      }

      const newSubject = await Subject.create({
        department,
        code,
        subject,
      });

      insertedSubjects.push(newSubject);
    }

    return res.status(201).json({
      message:
        duplicateSubjects.length > 0
          ? "Some subjects already exist"
          : "Subjects uploaded successfully",
      insertedCount: insertedSubjects.length,
      duplicateCount: duplicateSubjects.length,
      insertedSubjects,
      duplicateSubjects,
    });

  } catch (error) {
    console.error("Excel Upload Error:", error);
    return res.status(500).json({ message: error.message });
  }
};




export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ department: 1, code: 1 });

    res.status(200).json({
      total: subjects.length,
      subjects,
    });
  } catch (error) {
    console.error("Get All Subjects Error:", error);
    res.status(500).json({ message: error.message });
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
//update
// ✏️ UPDATE Subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params; // subject ID
    const updatedData = req.body; // code, subject

    const updatedSubject = await Subject.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedSubject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    
    res.status(200).json({
      message: "Subject updated successfully",
      subject: updatedSubject,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ❌ DELETE Subject
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Subject.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({ message: "Subject deleted successfully" });
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


