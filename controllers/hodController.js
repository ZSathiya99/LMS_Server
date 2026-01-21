// controllers/hodController.js
import Faculty from "../models/Faculty.js";

export const allocateHOD = async (req, res) => {
  try {
    const { facultyId, department } = req.body;

    if (!facultyId || !department) {
      return res.status(400).json({
        message: "facultyId and department are required",
      });
    }

    // 1️⃣ Remove existing HOD for department
    await Faculty.updateMany(
      { hodDepartment: department },
      { isHOD: false, hodDepartment: null }
    );

    // 2️⃣ Assign new HOD
    const faculty = await Faculty.findByIdAndUpdate(
      facultyId,
      {
        isHOD: true,
        hodDepartment: department,
      },
      { new: true }
    );

    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }

    res.status(200).json({
      message: "HOD allocated successfully",
      hod: {
        id: faculty._id,
        name: `${faculty.firstName} ${faculty.lastName}`,
        department: faculty.hodDepartment,
      },
    });
  } catch (error) {
    console.error("Allocate HOD Error:", error);
    res.status(500).json({ message: error.message });
  }
};
