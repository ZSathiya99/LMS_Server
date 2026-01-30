import Classroom from "../models/Classroom.js";

// ✅ CREATE NEW CLASS
export const createClassroom = async (req, res) => {
  try {
    const facultyId = req.user.facultyId; // from JWT
    const { className, section, subjectName } = req.body;

    if (!className || !section || !subjectName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const classroom = await Classroom.create({
      facultyId,
      className,
      section,
      subjectName,
    });

    return res.status(201).json({
      message: "Class created successfully",
      data: classroom,
    });
  } catch (error) {
    console.error("Create Classroom Error:", error);
    return res.status(500).json({ message: error.message });
  }
};


// ✅ GET ALL CLASSES OF FACULTY
export const getFacultyClassrooms = async (req, res) => {
  try {
    const facultyId = req.user.facultyId;

    const classes = await Classroom.find({
      facultyId,
      status: "active",
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Classes fetched successfully",
      total: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error("Get Classroom Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
