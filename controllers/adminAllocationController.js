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
      subjectType: new RegExp(`^${type}$`, "i"),
      semester: Number(semester),
      regulation: new RegExp(`^${regulation}$`, "i"),
      department: new RegExp(`^${department}$`, "i")
    });

    if (!allocation) return res.json([]);

    // Default temporary sections
    const defaultSections = [
      { sectionName: "Section A", staff: null },
      { sectionName: "Section B", staff: null },
      { sectionName: "Section C", staff: null }
    ];

    const formatted = allocation.subjects.map((sub) => ({
      subject: sub.subject,

      // If DB has sections, use them
      // Otherwise return temporary sections
      sections:
        sub.sections && sub.sections.length > 0
          ? sub.sections.map((sec) => ({
              sectionName: sec.sectionName,
              staff: sec.staff ? { name: sec.staff.name } : null
            }))
          : defaultSections
    }));

    res.json(formatted);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



