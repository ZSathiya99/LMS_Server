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

    // ✅ 1. get studentId from token (PERMANENT FIX)
    const studentId = req.user.id;

    if (!studentId) {
      return res.status(400).json({
        message: "Student ID missing in token",
      });
    }

    // ✅ 2. get assignment
    const assignment = await Assignment.findById(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    // ✅ 3. check student belongs to this class (IMPORTANT)
    const isMember = await ClassroomMembers.findOne({
      sectionId: assignment.sectionId,
      userId: studentId,
      role: "student",
    });

    if (!isMember) {
      return res.status(403).json({
        message: "You are not part of this class",
      });
    }

    // ✅ 4. validate files
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "Please upload at least one file",
      });
    }

    // ✅ 5. create file URLs
    const fileUrls = files.map(
      (file) =>
        `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
    );

    // ✅ 6. find existing submission
    const existingIndex = assignment.submissions.findIndex(
      (s) => s.studentId.toString() === studentId.toString()
    );

    if (existingIndex !== -1) {
      // 🔁 update existing
      assignment.submissions[existingIndex].attachments = fileUrls;
      assignment.submissions[existingIndex].submittedAt = new Date();
    } else {
      // ➕ create new
      assignment.submissions.push({
        studentId,
        attachments: fileUrls,
        submittedAt: new Date(),
      });
    }

    // ✅ 7. save
    await assignment.save();

    return res.status(200).json({
      message: "Assignment submitted successfully",
      studentId,
      attachments: fileUrls,
    });
  } catch (error) {
    console.error("Submit Assignment Error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};
//getAssignmentSubmissions

export const getAssignmentSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // ✅ role check
    if (req.user.role !== "faculty") {
      return res.status(403).json({
        message: "Access denied. Faculty only",
      });
    }

    // ✅ fetch only needed data + lean (faster)
    const assignment = await Assignment.findById(assignmentId)
      .select("submissions")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    // ✅ sort (fast JS)
    const submissions = assignment.submissions.sort(
      (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
    );

    return res.status(200).json({
      message: "Submissions fetched successfully",
      totalSubmissions: submissions.length,
      submissions,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      message: "Server error",
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

    // ✅ 1. role check
    if (req.user.role !== "faculty") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    // ✅ 2. get assignment (only needed fields)
    const assignment = await Assignment.findById(assignmentId)
      .select("submissions marks sectionId")
      .lean();

    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    // ✅ 3. optional: validate section match
    if (assignment.sectionId.toString() !== sectionId) {
      return res.status(400).json({
        message: "Invalid section for this assignment",
      });
    }

    // ✅ 4. get students
    const members = await ClassroomMembers.find({
      sectionId,
      role: "student",
    }).populate("userId", "firstName email profileImage");

    const submissions = assignment.submissions || [];

    // ✅ 5. optimize lookup using Map (fast)
    const submissionMap = new Map();
    submissions.forEach((s) => {
      submissionMap.set(s.studentId.toString(), s);
    });

    // ✅ 6. build response
    const result = members
      .map((member) => {
        const student = member.userId;
        if (!student) return null;

        const studentId = student._id.toString();
        const submission = submissionMap.get(studentId);

        const isSubmitted =
          submission &&
          submission.attachments &&
          submission.attachments.length > 0;

        return {
          assignmentId,
          studentId,
          name: student.firstName,
          email: student.email,
          profileImage: student.profileImage,

          status: isSubmitted ? "submitted" : "pending",

          attachments: isSubmitted ? submission.attachments : [],
          marksObtained: submission?.marksObtained ?? null,
          totalMarks: assignment.marks || 100,
          submittedAt: isSubmitted ? submission.submittedAt : null,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      message: "Student assignment status fetched",
      assignmentId,
      totalStudents: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Get Assignment Status Error:", error);
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