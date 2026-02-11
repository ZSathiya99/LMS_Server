import ClassroomMember from '../models/ClassroomMembers.js';
import AdminAllocation from '../models/adminAllocationModel.js';
import mongoose from 'mongoose';

export const getClassMembers = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!sectionId) {
      return res.status(400).json({ message: 'Section ID is required' });
    }

    // ✅ Verify section exists
    const allocation = await AdminAllocation.findOne({
      'subjects.sections._id': sectionId
    });

    if (!allocation) {
      return res.status(404).json({
        message: 'Classroom not found'
      });
    }

    // ✅ Fetch all members using sectionId
    const members = await ClassroomMember.find({ sectionId })
      .select('userId userModel role joinMethod createdAt')
      .populate('userId', 'firstName lastName email profileImage');
    console.log(members);
    const faculty = [];
    const students = [];

    for (const member of members) {
      if (!member.userId) continue; // safety

      const formatted = {
        id: member.userId._id,
        name: member.userId.firstName,
        email: member.userId.email,
        profileImg: member.userId.profileImage,
        joinMethod: member.joinMethod,
        joinedAt: member.createdAt
      };

      if (member.role === 'faculty') {
        faculty.push(formatted);
      } else if (member.role === 'student') {
        students.push(formatted);
      }
    }

    return res.status(200).json({
      faculty,
      students,
      totalFaculty: faculty.length,
      totalStudents: students.length
    });
  } catch (error) {
    console.error('Get Class Members Error:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

export const removeClassroomMember = async (req, res) => {
  try {
    const { sectionId, userId } = req.params;

    if (!sectionId || !userId) {
      return res.status(400).json({
        message: 'Section ID and User ID are required'
      });
    }

    // 🔒 Authorization check
    const requesterRole = req.user.role;
    const requesterId =
      requesterRole === 'faculty' ? req.user.facultyId : req.user.id;

    if (requesterRole !== 'faculty' && requesterRole !== 'admin') {
      return res.status(403).json({
        message: 'You are not allowed to remove classroom members'
      });
    }

    // ❌ Prevent self-removal (recommended)
    if (requesterId === userId) {
      return res.status(400).json({
        message: 'You cannot remove yourself from the classroom'
      });
    }

    // ✅ Verify section exists
    const allocation = await AdminAllocation.findOne({
      'subjects.sections._id': sectionId
    });

    if (!allocation) {
      return res.status(404).json({
        message: 'Classroom not found'
      });
    }

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: 'Invalid user ID'
      });
    }

    // 🔍 Find membership
    const member = await ClassroomMember.findOne({
      sectionId,
      userId
    });

    if (!member) {
      return res.status(404).json({
        message: 'User is not a member of this classroom'
      });
    }

    // ❌ Optional rule: prevent removing section’s assigned staff
    if (member.role === 'faculty') {
      const section = allocation.subjects
        .flatMap((s) => s.sections)
        .find((sec) => sec._id.toString() === sectionId);

      if (section?.staff?.id?.toString() === userId) {
        return res.status(400).json({
          message: 'Cannot remove assigned faculty from the classroom'
        });
      }
    }

    // 🗑️ Delete member
    await ClassroomMember.deleteOne({
      sectionId,
      userId
    });

    return res.status(200).json({
      message: 'Classroom member removed successfully'
    });
  } catch (error) {
    console.error('Remove Classroom Member Error:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};
