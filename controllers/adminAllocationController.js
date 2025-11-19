import AdminAllocation from "../models/adminAllocationModel.js";

// ✅ POST /api/adminAllocation
export const addAdminAllocation = async (req, res) => {
  try {
    const { department, admin } = req.body;

    if (!department || !admin) {
      return res.status(400).json({ message: "Missing department or admin details" });
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
      semester,
      semesterType,
      subjectType,
      regulation,
      subjects,
      department,
    } = req.body;

    if (!semester || !semesterType || !subjectType || !regulation || !subjects || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const allocation = new AdminAllocation({
      semester,
      semesterType,
      subjectType,
      regulation,
      subjects,
      department,
    });

    await allocation.save();

    res.status(201).json({
      message: "Subjects allocated successfully",
      allocation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
export const getAllocatedSubjects = async (req, res) => {
  try {
    const { type, semester, regulation, department } = req.query;

    const allocation = await AdminAllocation.findOne({
      semester: Number(semester),

      // Match theory/Theory/THEORY
      subjectType: new RegExp(`^${type}$`, "i"),

      // Match 2026 or "2026"
      regulation: new RegExp(`^${regulation}$`, "i"),

      // Match cse/CSE/Cse
      department: new RegExp(`^${department}$`, "i")
    });

    if (!allocation) return res.json([]);

    const formatted = allocation.subjects.map((item) => ({
      subject: item.subject,
      subjectCode : item.code,
      sections: item.sections
        ? item.sections.map(sec => ({
            sectionName: sec.sectionName,
            staff: sec.staff ? { name: sec.staff.name } : null
          }))
        : []
    }));

    res.json(formatted);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

