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
