import crypto from 'crypto';
import Classroom from '../models/Classroom.js';
import ClassroomMember from '../models/ClassroomMembers.js';
import ClassroomInvitation from '../models/ClassroomInvitation.js';
import { sendMail } from '../utils/sendMail.js';
import buildInviteEmail from '../utils/buildInviteEmail.js';

// ✅ CREATE NEW CLASS
export const createClassroom = async (req, res) => {
  try {
    const facultyId = req.user.facultyId;
    const { className, section, subjectName, year } = req.body;

    if (!className || !section || !subjectName || !year) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const enrollmentCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const classroom = await Classroom.create({
      facultyId,
      className,
      section,
      subjectName,
      year,
      enorollmentCode: enrollmentCode,
      joinEnabled: true
    });

    // auto-add faculty as teacher
    await ClassroomMember.create({
      classId: classroom._id,
      userId: facultyId,
      userModel: 'Faculty',
      role: 'TEACHER',
      joinMethod: 'LINK'
    });

    return res.status(201).json({
      message: 'Class created successfully',
      data: classroom
    });
  } catch (error) {
    console.error('Create Classroom Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ GET ALL CLASSES OF FACULTY
export const getFacultyClassrooms = async (req, res) => {
  try {
    const facultyId = req.user.facultyId;

    const classes = await Classroom.find({
      facultyId,
      status: 'active'
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: 'Classes fetched successfully',
      total: classes.length,
      data: classes
    });
  } catch (error) {
    console.error('Get Classroom Error:', error);
    return res.status(500).json({ message: error.message });
  }
};

// ✅ JOIN CLASSROOM
export const joinClassroom = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { classId } = req.params;
    const code = req.body.code;

    if (!classId || !code) {
      return res.status(400).json({
        message: 'Classroom ID and enrollment code are required'
      });
    }

    const classroom = await Classroom.findById(classId);

    if (!classroom) {
      return res.status(404).json({
        message: 'Classroom not found'
      });
    }

    if (classroom.enorollmentCode !== code) {
      return res.status(403).json({
        message: 'Invalid enrollment code'
      });
    }

    if (!classroom.joinEnabled) {
      return res.status(403).json({
        message: 'Joining is disabled for this classroom'
      });
    }

    if (classroom.status !== 'active') {
      return res.status(403).json({
        message: 'Classroom is archived'
      });
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
      classroomId: classId,
      className: classroom.className,
      subjectName: classroom.subjectName
    });
  } catch (error) {
    console.error('Join Classroom Error:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

// ✅ SEND INVITATIONS
export const sendInvitation = async (req, res) => {
  try {
    const facultyId = req.user.facultyId;
    const { classId } = req.params;
    const { emails, role } = req.body;

    if (!Array.isArray(emails) || emails.length === 0 || !role) {
      return res.status(400).json({
        message: 'Emails array and role are required'
      });
    }

    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const classroom = await Classroom.findById(classId);
    if (!classroom) {
      return res.status(404).json({ message: 'Classroom not found' });
    }

    const validEmails = emails
      .map((e) => e?.trim())
      .filter((e) => e && e.includes('@'));

    if (validEmails.length === 0) {
      return res.status(400).json({
        message: 'No valid email addresses provided'
      });
    }

    const invites = [];
    for (const email of validEmails) {
      const token = crypto.randomBytes(32).toString('hex');

      const invite = await ClassroomInvitation.create({
        classId,
        email,
        invitedBy: facultyId,
        role,
        userModel: role === 'faculty' ? 'Faculty' : 'Student',
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      const inviteLink = `${process.env.FRONTEND_URL}classroom/invite?token=${token}`;

      const html = buildInviteEmail({
        classroomName: `${classroom.className} - ${classroom.subjectName}`,
        role,
        inviteLink
      });
      await sendMail({
        to: email,
        subject: `Invitation to join ${classroom.className}`,
        html
      });

      invites.push(email);
    }

    return res.status(201).json({
      message: 'Invitations sent successfully',
      invited: invites
    });
  } catch (error) {
    console.error('Send Invitation Error:', error);

    if (error.message.includes('Email credentials')) {
      return res.status(500).json({
        message:
          'Email service is not configured. Please contact administrator.'
      });
    }

    if (error.message.includes('Failed to send email')) {
      return res.status(500).json({
        message: 'Failed to send invitations. Please try again later.'
      });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ✅ RESPOND INVITATION
export const respondInvitation = async (req, res) => {
  try {
    const { token, action } = req.body;
    let userId = req.user.id;
    const userRole = req.user.role;
    if (userRole === 'faculty') {
      userId = req.user.facultyId;
    }
    const userEmail = req.user.email;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

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

    if (invitation.email !== userEmail) {
      return res.status(403).json({ message: 'Email mismatch' });
    }

    if (
      (invitation.role === 'faculty' && userRole !== 'faculty') ||
      (invitation.role === 'student' && userRole !== 'student')
    ) {
      return res.status(403).json({ message: 'Role mismatch' });
    }

    if (action === 'reject') {
      invitation.status = 'Rejected';
      await invitation.save();
      return res.status(200).json({ message: 'Invitation rejected' });
    }

    const alreadyJoined = await ClassroomMember.findOne({
      classId: invitation.classId,
      userId
    });

    if (alreadyJoined) {
      return res.status(409).json({ message: 'Already joined classroom' });
    }

    await ClassroomMember.create({
      classId: invitation.classId,
      userId,
      userModel: invitation.userModel,
      role: invitation.role,
      joinMethod: 'invite'
    });

    invitation.status = 'Accepted';
    await invitation.save();

    return res.status(200).json({
      message: 'Invitation accepted and classroom joined'
    });
  } catch (error) {
    console.error('Respond Invitation Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
