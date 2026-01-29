import SubjectPlanning from "../models/SubjectPlanning.js";
import AdminAllocation from "../models/adminAllocationModel.js";
import Faculty from "../models/Faculty.js";


// // Helper function
// const getAcademicYear = (semester) => {
//   if (semester === 1 || semester === 2) return "1st Year";
//   if (semester === 3 || semester === 4) return "2nd Year";
//   if (semester === 5 || semester === 6) return "3rd Year";
//   if (semester === 7 || semester === 8) return "4th Year";
//   return `${semester}th Semester`;
// };

// export const getStaffSubjectPlanning = async (req, res) => {
//   try {
//     const userId = req.user.id; // JWT → User ID

//     const faculty = await Faculty.findOne({ userId });

//     if (!faculty) {
//       return res.status(404).json({
//         message: "Faculty profile not found",
//         data: [],
//       });
//     }

//     const staffId = faculty._id;

//     const allocations = await AdminAllocation.find({
//       "subjects.sections.staff.id": staffId.toString(),
//     });

//     if (!allocations.length) {
//       return res.status(200).json({
//         message: "No subjects assigned",
//         data: [],
//       });
//     }

//     const result = [];

//     allocations.forEach((allocation) => {
//       allocation.subjects.forEach((subject) => {
//         subject.sections.forEach((section) => {
//           if (section.staff?.id?.toString() === staffId.toString()) {
//             result.push({
//               subjectId: subject._id,        // 🔥 THIS WAS MISSING
//               subjectCode: subject.code,
//               subjectName: subject.subject,
//               department: allocation.department,
//               regulation: allocation.regulation,
//               semester: allocation.semester,
//               semesterType: allocation.semesterType,
//               sectionName: section.sectionName,
//             });
//           }
//         });
//       });
//     });

//     return res.status(200).json({
//       message: "Subject planning fetched successfully",
//       total: result.length,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Subject Planning Error:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };





export const addNewTopic = async (req, res) => {
  try {
    const {
      subjectId,
      unitName,
      topicName,
      teachingLanguage,
      date,
      hours,
      teachingAid,
      referenceBook,
    } = req.body;

    const staffId = req.user.id.toString();

    if (
      !subjectId ||
      !unitName ||
      !topicName ||
      !teachingLanguage ||
      !date ||
      !hours
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const newTopic = {
      topicName,
      teachingLanguage,
      date,
      hours,
      teachingAid,
      referenceBook,
    };

    // Step 1 — Try to push into existing unit
    let planning = await SubjectPlanning.findOneAndUpdate(
      {
        staffId,
        subjectId,
        "units.unitName": unitName,
      },
      {
        $push: {
          "units.$.topics": newTopic,
        },
      },
      { new: true }
    );

    // Step 2 — If unit does not exist, create new unit + topic
    if (!planning) {
      planning = await SubjectPlanning.findOneAndUpdate(
        { staffId, subjectId },
        {
          $push: {
            units: {
              unitName,
              topics: [newTopic],
            },
          },
        },
        { upsert: true, new: true }
      );
    }

    return res.status(201).json({
      message: "Topic added successfully",
      unitName,
      topic: newTopic,
    });
  } catch (error) {
    console.error("Add Topic Error:", error);
    return res.status(500).json({ message: error.message });
  }
};




export const getSubjectTopics = async (req, res) => {
  try {
    const staffId = req.user.id.toString();
    const { subjectId } = req.params;

    const planning = await SubjectPlanning.findOne({
      staffId,
      subjectId: subjectId.toString(),
    });

    if (!planning) {
      return res.status(200).json({
        message: "No topics added yet",
        units: [],
      });
    }

    return res.status(200).json({
      message: "Topics fetched successfully",
      units: planning.units,
    });
  } catch (error) {
    console.error("Get Topics Error:", error);
    return res.status(500).json({ message: error.message });
  }
};







export const editTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const staffId = req.user.id;

    const {
      unitName,
      topicName,
      teachingLanguage,
      date,
      hours,
      teachingAid,
      referenceBook,
    } = req.body;

    const planning = await SubjectPlanning.findOne({ staffId });
    if (!planning)
      return res.status(404).json({ message: "Planning not found" });

   const unit = planning.units.find(
  (u) => u.unitName.toLowerCase().trim() === unitName.toLowerCase().trim()
);

    if (!unit)
      return res.status(404).json({ message: "Unit not found" });

    const topic = unit.topics.find(
      (t) => t._id.toString() === topicId
    );
    if (!topic)
      return res.status(404).json({ message: "Topic not found" });

    topic.topicName = topicName ?? topic.topicName;
    topic.teachingLanguage = teachingLanguage ?? topic.teachingLanguage;
    topic.date = date ?? topic.date;
    topic.hours = hours ?? topic.hours;
    topic.teachingAid = teachingAid ?? topic.teachingAid;
    topic.referenceBook = referenceBook ?? topic.referenceBook;

    planning.markModified("units");
    await planning.save();

    res.status(200).json({
      message: "Topic updated successfully",
      topic,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const staffId = req.user.id;
    const { unitName } = req.body;

    const planning = await SubjectPlanning.findOne({ staffId });
    if (!planning)
      return res.status(404).json({ message: "Planning not found" });

    const unit = planning.units.find(
      (u) => u.unitName.toLowerCase().trim() === unitName.toLowerCase().trim()
    );

    if (!unit)
      return res.status(404).json({ message: "Unit not found" });

    const topicIndex = unit.topics.findIndex(
      (t) => t._id.toString() === topicId
    );

    if (topicIndex === -1)
      return res.status(404).json({ message: "Topic not found" });

    unit.topics.splice(topicIndex, 1);

    unit.topics.forEach((t, index) => {
      t.sno = index + 1;
    });

    planning.markModified("units");
    await planning.save();

    res.status(200).json({
      message: "Topic deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



