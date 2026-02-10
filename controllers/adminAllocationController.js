import AdminAllocation from "../models/adminAllocationModel.js";
import Faculty from "../models/Faculty.js";

// ✅ POST /api/adminAllocation
export const addAdminAllocation = async (req, res) => {
  try {
    const { department, admin } = req.body;

    if (!department || !admin) {
      return res
        .status(400)
        .json({ message: "Missing department or admin details" });
    }

    const newAdmin = new AdminAllocation({ department, admin });
    await newAdmin.save();

    res.status(201).json({
      message: "Admin allocated successfully",
      data: newAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ POST /api/adminAllocation/subjects


export const allocateSubjects = async (req, res) => {
  try {
    const {
      department,
      subjectType,
      semester,
      semesterType,
      regulation,
      subjects,
    } = req.body;

    // ✅ Validation
    if (
      !department ||
      !subjectType ||
      !semester ||
      !semesterType ||
      !regulation ||
      !Array.isArray(subjects)
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const safe = (v) => (v ? v.toString().trim() : "");

    let allocation = await AdminAllocation.findOne({
      department: { $regex: safe(department), $options: "i" },
      subjectType: { $regex: safe(subjectType), $options: "i" },
      semester: Number(semester),
      semesterType: { $regex: safe(semesterType), $options: "i" },
      regulation: { $regex: safe(regulation), $options: "i" },
    });

    // 🧼 Clean subjects (ignore _id from frontend)
    const cleanSubjects = subjects.map((s) => ({
      code: s.code,
      subject: s.subject,
      credits: s.credits,
    }));

    /* =====================================================
       🆕 CREATE
    ===================================================== */
    if (!allocation) {
      allocation = new AdminAllocation({
        department,
        subjectType,
        semester: Number(semester),
        semesterType,
        regulation,
        subjects: cleanSubjects.map((s) => ({
          ...s,
          sections: [],
        })),
      });

      await allocation.save();

      return res.status(201).json({
        message: "Subjects allocated successfully",
        allocation,
      });
    }

    /* =====================================================
       🔄 REPLACE SUBJECTS (THIS IS THE FIX)
    ===================================================== */

    // 1️⃣ Keep sections ONLY for subjects that still exist
    const updatedSubjects = cleanSubjects.map((newSub) => {
      const existing = allocation.subjects.find(
        (s) => s.code === newSub.code
      );

      return {
        code: newSub.code,
        subject: newSub.subject,
        credits: newSub.credits,
        sections: existing ? existing.sections : [],
      };
    });

    // 2️⃣ Replace entire subject list
    allocation.subjects = updatedSubjects;

    allocation.markModified("subjects");
    await allocation.save();

    return res.status(200).json({
      message: "Subjects updated successfully",
      allocation,
    });
  } catch (error) {
    console.error("Allocate Subjects Error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// GET /api/admin-allocation/subjects
export const getAllocatedSubjects = async (req, res) => {
  try {
    const {
      department,
      subjectType,
      semester,
      semesterType,
      regulation,
    } = req.query;

    // Validation
    if (
      !department ||
      !subjectType ||
      !semester ||
      !semesterType ||
      !regulation
    ) {
      return res.status(400).json({
        message: "All query parameters are required",
      });
    }

    const safe = (v) => (v ? v.toString().trim() : "");

    const allocation = await AdminAllocation.findOne({
      department: { $regex: safe(department), $options: "i" },
      subjectType: { $regex: safe(subjectType), $options: "i" },
      semester: Number(semester),
      semesterType: { $regex: safe(semesterType), $options: "i" },
      regulation: { $regex: safe(regulation), $options: "i" },
    });

    // ✅ IMPORTANT FIX: Do NOT return 404
    if (!allocation) {
      return res.status(200).json({
        message: "No subjects allocated yet",
        allocation: {
          department,
          subjectType,
          semester: Number(semester),
          semesterType,
          regulation,
          subjects: [],
        },
      });
    }

    return res.status(200).json({
      message: "Allocated subjects fetched successfully",
      allocation,
    });
  } catch (error) {
    console.error("Get Allocated Subjects Error:", error);
    return res.status(500).json({ message: error.message });
  }
};



export const getHodDashboardSubjects = async (req, res) => {
  try {
    const { type, semester, regulation, department } = req.query;

    if (!type || !semester || !regulation || !department) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // Get matching allocation
    const allocation = await AdminAllocation.findOne({
      subjectType: type,
      semester: Number(semester),
      regulation: Number(regulation),
      department: department.toUpperCase(),
    });

    // If nothing found return empty array
    if (!allocation) {
      return res.json([]);
    }

    // Format subjects as required by frontend
    const formattedData = allocation.subjects.map((item) => ({
      subject: item.subject,
      sections: item.sections.map((sec) => ({
        sectionName: sec.sectionName,
        staff: sec.staff ? { name: sec.staff.name } : null,
      })),
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("HOD Dashboard Error:", error);
    res.status(500).json({ message: error.message });
  }
};
// ⭐ ADD THIS FUNCTION
export const getHodDashboardData = async (req, res) => {
  try {
    const { subjectType, semester, regulation, department, semesterType } =
      req.query;

    const safe = (v) => (v ? v.toString().trim() : "");

    // Find allocation for HOD dashboard
    const allocation = await AdminAllocation.findOne({
      department: { $regex: safe(department), $options: "i" },
      subjectType: { $regex: safe(subjectType), $options: "i" },
      semester: Number(semester),
      semesterType: { $regex: safe(semesterType), $options: "i" },
      regulation: { $regex: safe(regulation.toString()), $options: "i" },
    });

    // Default section list
    const defaultSections = [
      { sectionName: "Section A" },
      { sectionName: "Section B" },
      { sectionName: "Section C" },
    ];

    // Prepare subjects + merged sections
    const subjects = allocation
      ? allocation.subjects.map((sub) => {
          const mergedSections = defaultSections.map((def) => {
            // find existing section (if already created)
            const existing = sub.sections.find(
              (s) => s.sectionName === def.sectionName
            );

            return {
              sectionName: def.sectionName,
              sectionId: existing?._id || null, // ⭐ ADD SECTION ID HERE
              staff: existing?.staff || null,
            };
          });

          return {
            id: sub._id,
            code: sub.code,
            subject: sub.subject,
            semesterType: allocation.semesterType,
            sections: mergedSections,
          };
        })
      : [];

    // Faculty List
    const facultyRaw = await Faculty.find({
      department: { $regex: safe(department), $options: "i" },
    }).select("firstName lastName email designation role");

    const facultyList = facultyRaw.map((f) => ({
      id: f._id,
      name: `${f.firstName} ${f.lastName}`,
      email: f.email,
      designation: f.designation,
      role: f.role,
      
    }));

    // Final response
    res.json({
      semesterType: allocation?.semesterType || null,
      subjects,
      faculty: facultyList,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: error.message });
  }
};


// ✔ POST → Assign staff
// ✔ PUT → Update staff
// ✔ DELETE → Remove staff
// Generate random classroom code (6 characters)
const generateClassroomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const assignStaffToSection = async (req, res) => {
  try {
    const {
      department,
      subjectType,
      semester,
      semesterType,
      regulation,
      subjectId,
      sectionName,
      staffId,
    } = req.body;

    if (
      !department ||
      !subjectType ||
      !semester ||
      !semesterType ||
      !regulation ||
      !subjectId ||
      !sectionName ||
      !staffId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const staff = await Faculty.findById(staffId).select(
      "firstName lastName email profileImg"
    );
    if (!staff)
      return res.status(404).json({ message: "Staff not found" });

    const safe = (v) => (v ? v.toString().trim() : "");

    const allocation = await AdminAllocation.findOne({
      department: { $regex: safe(department), $options: "i" },
      subjectType: { $regex: safe(subjectType), $options: "i" },
      semester: Number(semester),
      semesterType: { $regex: safe(semesterType), $options: "i" },
      regulation: { $regex: safe(regulation.toString()), $options: "i" },
    });

    if (!allocation)
      return res.status(404).json({ message: "Allocation not found" });

    const subject = allocation.subjects.id(subjectId);
    if (!subject)
      return res.status(404).json({ message: "Subject not found" });

    let section = subject.sections.find(
      (sec) => sec.sectionName === sectionName
    );

    // -------------------------
    // FIRST TIME → CREATE SECTION + CLASSROOM CODE
    // -------------------------
    if (!section) {
      const classroomCode = generateClassroomCode();

      section = {
        sectionName,
        classroomCode, // 🔥 Added classroom code
        staff: {
          id: staffId,
          name: `${staff.firstName} ${staff.lastName}`,
          email: staff.email,
          profileImg: staff.profileImg || null,
        },
      };

      subject.sections.push(section);

      allocation.markModified("subjects");
      await allocation.save();

      return res.json({
        message: "Section created and staff assigned successfully",
        subjectId,
        sectionName,
        classroomCode, // 🔥 Sending classroom code
        section,
      });
    }

    // -------------------------
    // SECOND TIME → UPDATE STAFF ONLY
    // -------------------------
    section.staff = {
      id: staffId,
      name: `${staff.firstName} ${staff.lastName}`,
      email: staff.email,
      profileImg: staff.profileImg || null,
    };

    allocation.markModified("subjects");
    await allocation.save();

    return res.json({
      message: "Staff updated successfully",
      subjectId,
      sectionName,
      classroomCode: section.classroomCode, // 🔥 Return existing code
      staff: section.staff,
    });
  } catch (error) {
    console.error("Assign Staff Error:", error);
    res.status(500).json({ message: error.message });
  }
};



export const updateStaffForSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({ message: "staffId is required" });
    }

    // Find staff details
    const staff = await Faculty.findById(staffId).select(
      "firstName lastName email profileImg"
    );
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Find allocation that contains this section
    const allocation = await AdminAllocation.findOne({
      "subjects.sections._id": sectionId,
    });

    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    // Find subject and section
    const subject = allocation.subjects.find((sub) =>
      sub.sections.some((sec) => sec._id.toString() === sectionId)
    );
    const section = subject.sections.id(sectionId);

    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Update staff details
    section.staff = {
      id: staffId,
      name: `${staff.firstName} ${staff.lastName}`,
      email: staff.email,
      profileImg: staff.profileImg || null,
    };

    allocation.markModified("subjects");
    await allocation.save();

    return res.json({
      message: "Staff updated successfully",
      section,
    });
  } catch (error) {
    console.error("Update Staff Error:", error);
    res.status(500).json({ message: error.message });
  }
};


export const deleteStaffFromSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Find allocation that contains section
    const allocation = await AdminAllocation.findOne({
      "subjects.sections._id": sectionId,
    });

    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    // Find subject containing this section
    const subject = allocation.subjects.find((sub) =>
      sub.sections.some((sec) => sec._id.toString() === sectionId)
    );

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // DELETE the section completely
    subject.sections = subject.sections.filter(
      (sec) => sec._id.toString() !== sectionId
    );

    allocation.markModified("subjects");
    await allocation.save();

    return res.json({
      message: "Section deleted successfully",
      sections: subject.sections,   // will be [] if last one deleted
    });

  } catch (error) {
    console.error("Delete Section Error:", error);
    res.status(500).json({ message: error.message });
  }
};


//DELETE SECTION 
export const deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const allocation = await AdminAllocation.findOne({
      "subjects.sections._id": sectionId,
    });

    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    // Find subject
    const subject = allocation.subjects.find((sub) =>
      sub.sections.some((sec) => sec._id.toString() === sectionId)
    );

    // Remove section
    subject.sections = subject.sections.filter(
      (sec) => sec._id.toString() !== sectionId
    );

    allocation.markModified("subjects");
    await allocation.save();

    return res.json({
      message: "Section deleted successfully",
    });

  } catch (error) {
    console.error("Delete Section Error:", error);
    res.status(500).json({ message: error.message });
  }
};
