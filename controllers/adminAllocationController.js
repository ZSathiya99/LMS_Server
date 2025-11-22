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
      semester,
      semesterType,
      subjectType,
      regulation,
      subjects,
      department,
    } = req.body;

    if (
      !semester ||
      !semesterType ||
      !subjectType ||
      !regulation ||
      !subjects ||
      !department
    ) {
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
export const getHodDashboardData = async (req, res) => {
  try {
    const { type, semester, regulation, department, semesterType } = req.query;

    const safe = (val) => (val ? val.toString().trim() : "");

    const allocation = await AdminAllocation.findOne({
      semester: Number(semester),
      subjectType: { $regex: safe(type), $options: "i" },
      semesterType: { $regex: safe(semesterType), $options: "i" },
      regulation: { $regex: safe(regulation), $options: "i" },
      department: { $regex: safe(department), $options: "i" },
    });

    const defaultSections = [
      { sectionName: "Section A", staff: null },
      { sectionName: "Section B", staff: null },
      { sectionName: "Section C", staff: null },
    ];

    const subjects = allocation
      ? allocation.subjects.map((sub) => {
          const mergedSections = defaultSections.map((def) => {
            const dbSection = sub.sections?.find(
              (s) => s.sectionName === def.sectionName
            );

            return {
              sectionName: def.sectionName,
              staff: dbSection?.staff?.name
                ? { name: dbSection.staff.name }
                : null,
            };
          });

          return {
            id: sub._id,
            subject: sub.subject,
            sections: mergedSections,
          };
        })
      : [];

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

    res.json({
      subjects,
      faculty: facultyList,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: error.message });
  }
};




// ✔ POST → Assign staff
// ✔ PUT → Update staff
// ✔ DELETE → Remove staff
export const assignStaffToSection = async (req, res) => {
  try {
    const {
      department,
      type,
      semester,
      regulation,
      subjectId,
      sectionName,
      staffId,
    } = req.body;

    // 1. Validate
    if (
      !department ||
      !type ||
      !semester ||
      !regulation ||
      !subjectId ||
      !sectionName ||
      !staffId
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Find staff details
    const staff = await Faculty.findById(staffId).select(
      "firstName lastName email profileImg"
    );
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    // 3. Find matching allocation
    const allocation = await AdminAllocation.findOne({
      subjectType: new RegExp(`^${type}$`, "i"),
      semester,
      regulation,
      department,
    });

    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    // 4. Find subject
    const subject = allocation.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // 5. Find OR Create section
    let section = subject.sections.find(
      (sec) => sec.sectionName === sectionName
    );

    if (!section) {
      section = {
        sectionName,
        staff: null,
      };
      subject.sections.push(section);
    }

    // 6. Assign staff object
    section.staff = {
      id: staffId,
      name: `${staff.firstName} ${staff.lastName}`,
      email: staff.email,
      profileImg: staff.profileImg || null,
    };

    // 7. Save database
    await allocation.save();

    res.json({
      message: "Staff assigned successfully",
      subjectId,
      sectionName,
      staff: section.staff,
    });
  } catch (error) {
    console.error("Assign staff error:", error);
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

    const staff = await Faculty.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Find allocation containing this section
    const allocation = await AdminAllocation.findOne({
      "subjects.sections._id": sectionId,
    });

    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    // Locate the section
    const subject = allocation.subjects.find((sub) =>
      sub.sections.some((sec) => sec._id.toString() === sectionId)
    );

    const section = subject.sections.id(sectionId);

    // Update staff
    section.staff = {
      facultyId: staff._id,
      name: staff.firstName + " " + staff.lastName,
      email: staff.email,
    };

    await allocation.save();

    res.json({ message: "Staff updated successfully", section });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteStaffFromSection = async (req, res) => {
  try {
    const { sectionId } = req.params;

    const allocation = await AdminAllocation.findOne({
      "subjects.sections._id": sectionId,
    });

    if (!allocation) {
      return res.status(404).json({ message: "Allocation not found" });
    }

    // Locate subject & section
    const subject = allocation.subjects.find((sub) =>
      sub.sections.some((sec) => sec._id.toString() === sectionId)
    );

    const section = subject.sections.id(sectionId);

    // Remove staff
    section.staff = null;

    await allocation.save();

    res.json({
      message: "Staff removed successfully",
      sectionId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
