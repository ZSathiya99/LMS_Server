import mongoose from 'mongoose';
import Assignment from '../models/Assignment.js';
import ClassroomMembers from '../models/ClassroomMembers.js';
import Student from "../models/Student.js";
import AdminAllocation from '../models/adminAllocationModel.js';


/* =====================================================
   CREATE ASSIGNMENT
===================================================== */
export const createAssignment = async (req, res) => {
  try {
    const {
      subjectId,
      sectionId, // 🔥 added
      title,
      instruction,
      link,
      youtubeLink,
      dueDate,
      questions,
      marks
    } = req.body;

    const staffId = req.user.facultyId;

    if (!subjectId || !sectionId || !title || !dueDate || !marks) {
      return res.status(400).json({
        message: 'subjectId, sectionId, title, due date and marks are required'
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({
        message: 'Invalid subjectId or sectionId'
      });
    }

    if (Number(marks) <= 0) {
      return res.status(400).json({
        message: 'Marks must be greater than 0'
      });
    }

    const uploadedFiles =
      req.files?.map(
        (file) =>
          `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      ) || [];

    const assignment = await Assignment.create({
      subjectId,
      sectionId, // 🔥 added
      staffId,
      title,
      instruction: instruction || '',
      attachments: uploadedFiles,
      link: link || '',
      youtubeLink: youtubeLink || '',
      dueDate,
      marks: Number(marks),
      questions: questions || '',
      comments: [],
      submissions: []
    });

    return res.status(201).json({
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Create Assignment Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET ASSIGNMENTS BY SUBJECT (WITH STATS)
===================================================== */
export const getAssignmentsBySubject = async (req, res) => {
  try {
    const { subjectId, sectionId } = req.params;
    const staffId = req.user.facultyId;

    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    /* 1️⃣ Get Classroom Students */
    const classroomStudents = await ClassroomMembers.find({
      subjectId,
      sectionId // 🔥 added
    }).populate(
      'studentId',
      'firstName lastName registerNumber email profileImg'
    );

    const totalStudents = classroomStudents.length;

    /* 2️⃣ Get Assignments */
    const assignments = await Assignment.find({
      subjectId,
      sectionId, // 🔥 added
      staffId // 🔥 prevent cross-staff
    }).sort({ createdAt: -1 });

    /* 3️⃣ Build Response */
    const result = assignments.map((assignment) => {
      const assignmentData = assignment.toObject();

      const submittedIds = assignment.submissions.map((s) =>
        s.studentId.toString()
      );

      const submittedStudents = classroomStudents
        .filter((stu) => submittedIds.includes(stu.studentId._id.toString()))
        .map((stu) => {
          const submission = assignment.submissions.find(
            (s) => s.studentId.toString() === stu.studentId._id.toString()
          );

          return {
            ...stu.studentId.toObject(),
            submittedAt: submission?.submittedAt,
            marksObtained: submission?.marksObtained,
            attachment: submission?.attachment
          };
        });

      const pendingStudents = classroomStudents
        .filter((stu) => !submittedIds.includes(stu.studentId._id.toString()))
        .map((stu) => stu.studentId);

      return {
        ...assignmentData,
        key: 'Assignment',

        stats: {
          totalStudents,
          submitted: submittedStudents.length,
          pending: pendingStudents.length,
          comments: assignment.comments.length
        },

        students: {
          all: classroomStudents.map((stu) => stu.studentId),
          submitted: submittedStudents,
          pending: pendingStudents
        }
      };
    });

    return res.status(200).json({
      totalAssignments: result.length,
      assignments: result
    });
  } catch (error) {
    console.error('Get Assignments Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   GET SINGLE ASSIGNMENT
===================================================== */
export const getSingleAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: 'Invalid Assignment ID' });
    }

    const assignment = await Assignment.findOne({
      _id: assignmentId,
      staffId // 🔥 prevent cross access
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    return res.status(200).json(assignment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   UPDATE ASSIGNMENT
===================================================== */
export const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: 'Invalid Assignment ID' });
    }

    const updated = await Assignment.findOneAndUpdate(
      { _id: assignmentId, staffId },
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    return res.status(200).json({
      message: 'Assignment updated successfully',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   DELETE ASSIGNMENT
===================================================== */
export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const staffId = req.user.facultyId;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ message: 'Invalid Assignment ID' });
    }

    const deleted = await Assignment.findOneAndDelete({
      _id: assignmentId,
      staffId
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    return res.status(200).json({
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   ADD COMMENT (STAFF / STUDENT)
===================================================== */
export const addAssignmentComment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Comment required' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    assignment.comments.push({
      userId:
        req.user.role === 'faculty' ? req.user.facultyId : req.user.studentId,
      userType: req.user.role === 'faculty' ? 'staff' : 'student',
      comment
    });

    await assignment.save();

    return res.status(201).json({
      message: 'Comment added successfully',
      comments: assignment.comments
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* =====================================================
   STUDENT SUBMIT ASSIGNMENT
===================================================== */


export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const email = req.user.email;
    const student = await Student.findOne({ email }).lean();

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    } 
    const studentId = student._id;
    if (!studentId) {
      return res.status(400).json({
        message: "Student ID missing in token",
      });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one file",
      });
    }

    // ✅ create file URLs
    const fileUrls = files.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
    );

    // 🔍 check existing submission
    const existing = assignment.submissions.find(
      (s) => s.studentId.toString() === studentId.toString()
    );

    if (existing) {
      // ✅ replace files
      existing.attachments = fileUrls;
      existing.submittedAt = new Date();
    } else {
      assignment.submissions.push({
        studentId,
        attachments: fileUrls,
        submittedAt: new Date(),
      });
    }

    await assignment.save();

    return res.status(200).json({
      message: "Assignment submitted successfully",
      submissions: assignment.submissions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
//GET API (Student – view own submission)

export const getMySubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const email = req.user.email;

    const student = await Student.findOne({ email }).lean();

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const assignment = await Assignment.findById(assignmentId).lean();

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    // ✅ find student submission
    const submission = assignment.submissions.find(
      (s) => s.studentId.toString() === student._id.toString()
    );

    if (!submission) {
      return res.status(404).json({
        message: "No submission found",
      });
    }

    return res.status(200).json({
      message: "Submission fetched successfully",
      submission,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
//DELETE API (Student – remove submission)
export const deleteMySubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const email = req.user.email;

    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    // ✅ find index
    const index = assignment.submissions.findIndex(
      (s) => s.studentId.toString() === student._id.toString()
    );

    if (index === -1) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    // ✅ remove submission
    assignment.submissions.splice(index, 1);

    await assignment.save();

    return res.status(200).json({
      message: "Submission deleted successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

/* =====================================================
   GRADE SUBMISSION (STAFF)
===================================================== */
export const gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const { marksObtained } = req.body;

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = assignment.submissions.find(
      (s) => s.studentId.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.marksObtained = marksObtained;
    await assignment.save();

    return res.json({
      message: 'Marks updated successfully',
      submission
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//GET API (Student Assignment)


export const getStudentAssignments = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const userRole = req.user.role;

    const { subjectId, sectionId } = req.params;

    // 1️⃣ Only student
    if (userRole !== "student") {
      return res.status(403).json({
        message: "Access denied. Only students allowed",
      });
    }

    // 2️⃣ Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(subjectId) ||
      !mongoose.Types.ObjectId.isValid(sectionId)
    ) {
      return res.status(400).json({
        message: "Invalid subjectId or sectionId",
      });
    }

    // 3️⃣ Get student
    const student = await Student.findOne({ email: userEmail }).lean();

    if (!student) {
      return res.status(404).json({
        message: "Student not found",
      });
    }

    // 4️⃣ Security check (student belongs to section)
    const membership = await ClassroomMembers.findOne({
      userId: student._id,
      sectionId: sectionId,
      role: "student",
    });

    if (!membership) {
      return res.status(403).json({
        message: "You are not assigned to this section",
      });
    }

    // 5️⃣ Get assignments (FILTERED 🔥)
    const assignments = await Assignment.find({
      subjectId,
      sectionId,
    })
      .sort({ createdAt: -1 })
      .lean();

    // 6️⃣ Get subject + section + staff
    const allocation = await AdminAllocation.findOne({
      "subjects.sections._id": sectionId,
    }).lean();

    let subjectName = "";
    let sectionName = "";
    let staffName = "";

    if (allocation) {
      for (const sub of allocation.subjects) {
        if (sub.subjectId.toString() === subjectId.toString()) {
          const section = sub.sections.find(
            (s) => s._id.toString() === sectionId.toString()
          );

          if (section) {
            subjectName = sub.subject;
            sectionName = section.sectionName;
            staffName = section.staff?.name || "";
            break;
          }
        }
      }
    }

    // 7️⃣ Format response
    const results = assignments.map((a) => ({
      _id: a._id,

      subjectId: a.subjectId,
      sectionId: a.sectionId,

      title: a.title,
      instruction: a.instruction,
      attachments: a.attachments,
      link: a.link,
      youtubeLink: a.youtubeLink,
      dueDate: a.dueDate,
      marks: a.marks,
      questions: a.questions,

      subject: subjectName,
      section: sectionName,
      staffName: staffName,
    }));

    res.json({
      totalAssignments: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Student Assignment Error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
};


//You must combine 2 data sources:

// ClassroomMember → all students
// Assignment.submissions → submitted students



export const getAssignmentStudentStatus = async (req, res) => {
  try {
    const { assignmentId, sectionId } = req.params;

    if (req.user.role !== "faculty") {
      return res.status(403).json({ message: "Access denied" });
    }

    const assignment = await Assignment.findById(assignmentId)
      .select("submissions marks")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    const members = await ClassroomMembers.find({
      sectionId,
      role: "student",
    }).populate("userId", "firstName email profileImage");

    const submissions = assignment.submissions || [];

    const result = members.map((member) => {
      const student = member.userId;
      if (!student) return null;

      const studentId = student._id.toString();

      const submission = submissions.find(
        (s) => s.studentId.toString() === studentId
      );

      // ✅ condition
      const isSubmitted =
        submission && submission.attachments && submission.attachments.length > 0;

      return {
        assignmentId,
        studentId,
        name: student.firstName,
        email: student.email,
        profileImage: student.profileImage,

        // ✅ FINAL STATUS LOGIC
        status: isSubmitted ? "submitted" : "",

        attachments: isSubmitted ? submission.attachments : [],
        marksObtained: submission?.marksObtained ?? null,
        totalMarks: assignment.marks || 100,
        submittedAt: isSubmitted ? submission.submittedAt : null,
      };
    }).filter(Boolean);

    return res.status(200).json({
      message: "Student assignment status fetched",
      totalStudents: result.length,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};
//Update Marks API
export const addMarks = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;
    const { marks } = req.body;

    if (req.user.role !== "faculty") {
      return res.status(403).json({ message: "Access denied" });
    }

    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // 🔍 debug
    console.log(
      "DB studentIds:",
      assignment.submissions.map(s => s.studentId.toString())
    );
    console.log("Request studentId:", studentId);

    const submission = assignment.submissions.find(
      (s) => s.studentId.toString() === studentId
    );

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found - ID mismatch",
      });
    }

    submission.marksObtained = marks;

    await assignment.save();

    return res.json({
      message: "Marks added successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};