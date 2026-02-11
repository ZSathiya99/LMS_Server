import ClassroomMember from '../models/ClassroomMembers.js';
import AdminAllocation from '../models/adminAllocationModel.js';

export const getMyJoinedClasses = async (req, res) => {
  try {
    let userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'faculty') {
      userId = req.user.facultyId;
    }

    // 1️⃣ Get all joined classroom memberships
    const memberships = await ClassroomMember.find({
      userId
    }).select('classId role joinMethod');

    if (memberships.length === 0) {
      return res.status(200).json({
        total: 0,
        data: []
      });
    }

    const classIds = memberships.map((m) => m.classId.toString());

    // 2️⃣ Find allocations containing these sections
    const allocations = await AdminAllocation.find({
      'subjects.sections._id': { $in: classIds }
    });

    const result = [];

    // 3️⃣ Build response
    for (const allocation of allocations) {
      for (const subject of allocation.subjects) {
        for (const section of subject.sections) {
          if (classIds.includes(section._id.toString())) {
            const membership = memberships.find(
              (m) => m.classId.toString() === section._id.toString()
            );

            result.push({
              classId: subject._id,
              sectionId: section._id,
              department: allocation.department,
              regulation: allocation.regulation,
              semester: allocation.semester,
              semesterType: allocation.semesterType,

              subjectCode: subject.code,
              subjectName: subject.subject,

              sectionName: section.sectionName,
              classroomCode: section.classroomCode,

              role: membership.role,
              joinMethod: membership.joinMethod
            });
          }
        }
      }
    }

    return res.status(200).json({
      total: result.length,
      data: result
    });
  } catch (error) {
    console.error('Get Joined Classes Error:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};
