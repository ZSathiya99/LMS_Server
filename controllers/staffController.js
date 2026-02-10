import crypto from 'crypto';
import AdminAllocation from '../models/adminAllocationModel.js';
import ClassroomInvitation from '../models/ClassroomInvitation.js';
import ClassroomMember from '../models/ClassroomMembers.js';
import { sendMail } from '../utils/sendMail.js';
import buildInviteEmail from '../utils/buildInviteEmail.js';

// Helper function
const getAcademicYear = (semester) => {
  if (semester === 1 || semester === 2) return '1st Year';
  if (semester === 3 || semester === 4) return '2nd Year';
  if (semester === 5 || semester === 6) return '3rd Year';
  if (semester === 7 || semester === 8) return '4th Year';
  return `${semester}th Semester`;
};

export const getStaffSubjectPlanning = async (req, res) => {
  try {
    const staffId = req.user.facultyId;

    const imageList = [
      '/images/banner1.png',
      '/images/banner2.png',
      '/images/banner3.png',
      '/images/banner4.png',
      '/images/banner5.png'
    ];

    const getRandomImage = () => {
      const randomIndex = Math.floor(Math.random() * imageList.length);
      return imageList[randomIndex];
    };

    const allocations = await AdminAllocation.find({
      'subjects.sections.staff.id': staffId.toString()
    });

    const result = [];

    for (const allocation of allocations) {
      let isModified = false;

      for (const subject of allocation.subjects) {
        for (const section of subject.sections) {
          if (section.staff?.id?.toString() === staffId.toString()) {
            // ✅ CHECK classroomCode INSIDE SECTION
            if (!section.classroomCode) {
              const randomCode = Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();

              section.classroomCode = `${subject.code}-${randomCode}`;
              isModified = true;
            }

            result.push({
              subjectId: subject._id,
              sectionId: section._id,
              department: allocation.department,
              regulation: allocation.regulation,
              semester: allocation.semester,
              semesterType: allocation.semesterType,
              year: getAcademicYear(allocation.semester),
              subjectCode: subject.code,
              subjectName: subject.subject,
              sectionName: section.sectionName,
              classroomCode: section.classroomCode, // ✅ RETURN THIS
              image: getRandomImage()
            });
          }
        }
      }

      if (isModified) {
        allocation.markModified('subjects');
        await allocation.save();
      }
    }

    return res.status(200).json({
      total: result.length,
      data: result
    });
  } catch (error) {
    console.error('Subject Planning Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

export const joinClassroom = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId } = req.params;
    const { code } = req.body;

    if (!classId || !code) {
      return res.status(400).json({
        message: 'Class ID and classroom code are required'
      });
    }

    // 🔍 find section by _id
    const allocation = await AdminAllocation.findOne({
      'subjects.sections._id': classId
    });

    if (!allocation) {
      return res.status(404).json({
        message: 'Classroom not found'
      });
    }

    let sectionFound = null;
    let subjectFound = null;

    for (const subject of allocation.subjects) {
      for (const section of subject.sections) {
        if (section._id.toString() === classId) {
          sectionFound = section;
          subjectFound = subject;
          break;
        }
      }
    }

    if (!sectionFound) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    if (sectionFound.classroomCode !== code) {
      return res.status(403).json({ message: 'Invalid classroom code' });
    }

    const alreadyJoined = await ClassroomMember.findOne({
      classId,
      userId: studentId
    });

    if (alreadyJoined) {
      return res.status(409).json({
        message: 'Already joined this classroom'
      });
    }

    await ClassroomMember.create({
      classId,
      userId: studentId,
      userModel: 'Student',
      role: 'student',
      joinMethod: 'self'
    });

    return res.status(200).json({
      message: 'Joined classroom successfully',
      subjectName: subjectFound.subject,
      subjectCode: subjectFound.code,
      section: sectionFound.sectionName
    });
  } catch (error) {
    console.error('Join Classroom Error:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

export const sendInvitation = async (req, res) => {
  try {
    const facultyId = req.user.facultyId;
    const { classId } = req.params; // section._id
    const { emails, role } = req.body;

    if (!Array.isArray(emails) || emails.length === 0 || !role) {
      return res.status(400).json({
        message: 'Emails array and role are required'
      });
    }

    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // 🔍 Find allocation + section
    const allocation = await AdminAllocation.findOne({
      'subjects.sections._id': classId
    });

    if (!allocation) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    let sectionFound, subjectFound;

    for (const subject of allocation.subjects) {
      for (const section of subject.sections) {
        if (section._id.toString() === classId) {
          sectionFound = section;
          subjectFound = subject;
          break;
        }
      }
    }

    if (!sectionFound) {
      return res.status(404).json({ message: 'Classroom section not found' });
    }

    const invited = [];

    for (const rawEmail of emails) {
      const email = rawEmail?.trim().toLowerCase();
      if (!email || !email.includes('@')) continue;

      const token = crypto.randomBytes(32).toString('hex');

      await ClassroomInvitation.create({
        classId,
        email,
        invitedBy: facultyId,
        role,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      const inviteLink = `${process.env.FRONTEND_URL}classroom/invite?token=${token}`;
      console.log(subjectFound);
      const html = buildInviteEmail({
        subjectName: subjectFound.subject,
        inviteLink
      });

      await sendMail({
        to: email,
        subject: `Invitation to join ${subjectFound.code} - ${sectionFound.sectionName}`,
        html
      });

      invited.push(email);
    }

    return res.status(201).json({
      message: 'Invitations sent successfully',
      invited
    });
  } catch (error) {
    console.error('Send Invitation Error:', error);

    if (error.message.includes('Email')) {
      return res.status(500).json({
        message: 'Email service not configured'
      });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const respondInvitation = async (req, res) => {
  try {
    const { token, action } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    let userId = req.user.id;
    const userRole = req.user.role;
    const userEmail = req.user.email;

    // faculty uses facultyId
    if (userRole === 'faculty') {
      userId = req.user.facultyId;
    }

    // 1️⃣ Find invitation
    const invitation = await ClassroomInvitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({ message: 'Invalid invitation' });
    }

    if (invitation.status !== 'Pending') {
      return res.status(400).json({ message: 'Invitation already used' });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = 'Expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation expired' });
    }

    // 2️⃣ Email + role validation
    if (invitation.email !== userEmail) {
      return res.status(403).json({ message: 'Email mismatch' });
    }

    if (
      (invitation.role === 'faculty' && userRole !== 'faculty') ||
      (invitation.role === 'student' && userRole !== 'student')
    ) {
      return res.status(403).json({ message: 'Role mismatch' });
    }

    // 3️⃣ Reject flow
    if (action === 'reject') {
      invitation.status = 'Rejected';
      await invitation.save();

      return res.status(200).json({
        message: 'Invitation rejected'
      });
    }

    // 4️⃣ Validate classroom (section) exists
    const allocation = await AdminAllocation.findOne({
      'subjects.sections._id': invitation.classId
    });

    if (!allocation) {
      return res.status(404).json({
        message: 'Classroom not found'
      });
    }

    // 5️⃣ Already joined check
    const alreadyJoined = await ClassroomMember.findOne({
      classId: invitation.classId,
      userId
    });

    if (alreadyJoined) {
      return res.status(409).json({
        message: 'Already joined classroom'
      });
    }

    // 6️⃣ Create membership
    await ClassroomMember.create({
      classId: invitation.classId, // section._id
      userId,
      userModel: invitation.role === 'faculty' ? 'Faculty' : 'Student',
      role: invitation.role,
      joinMethod: 'invite'
    });

    // 7️⃣ Mark invitation accepted
    invitation.status = 'Accepted';
    await invitation.save();

    return res.status(200).json({
      message: 'Invitation accepted and classroom joined successfully'
    });
  } catch (error) {
    console.error('Respond Invitation Error:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};
