import SubjectPlanning from "../models/SubjectPlanning.js";

/* =========================================================
   ADD NEW TOPIC
========================================================= */
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

    const staffId = req.user.facultyId.toString();

    if (!subjectId || !unitName || !topicName || !date || !hours) {
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

    // Try pushing topic into existing unit
    let planning = await SubjectPlanning.findOneAndUpdate(
      {
        staffId,
        subjectId,
        "units.unitName": unitName,
      },
      {
        $push: { "units.$.topics": newTopic },
      },
      { new: true }
    );

    // If unit not found → create unit
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
      topic: newTopic,
    });
  } catch (error) {
    console.error("Add Topic Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   GET SUBJECT TOPICS
========================================================= */
export const getSubjectTopics = async (req, res) => {
  try {
    const staffId = req.user.facultyId.toString();
    const { subjectId } = req.params;

    const planning = await SubjectPlanning.findOne({
      staffId,
      subjectId,
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

/* =========================================================
   EDIT TOPIC (OWNER + ADMIN/HOD OVERRIDE)
========================================================= */
export const editTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const staffId = req.user.facultyId.toString();
    const role = req.user.role; // faculty | HOD | admin

    // 🔍 Find planning containing this topic
    const planning = await SubjectPlanning.findOne({
      "units.topics._id": topicId,
    });

    if (!planning) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // 🔐 Ownership check
    if (planning.staffId !== staffId && role !== "admin" && role !== "HOD") {
      return res.status(403).json({
        message: "You are not allowed to edit this topic",
      });
    }

    let foundTopic = null;

    for (const unit of planning.units) {
      const topic = unit.topics.id(topicId);
      if (topic) {
        foundTopic = topic;
        break;
      }
    }

    if (!foundTopic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    Object.assign(foundTopic, req.body);

    planning.markModified("units");
    await planning.save();

    return res.status(200).json({
      message: "Topic updated successfully",
      topic: foundTopic,
    });
  } catch (error) {
    console.error("Edit Topic Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   DELETE TOPIC (OWNER + ADMIN/HOD OVERRIDE)
========================================================= */
export const deleteTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const staffId = req.user.facultyId;
    const { unitName } = req.body;

    if (!unitName) {
      return res.status(400).json({ message: "unitName is required" });
    }

    const planning = await SubjectPlanning.findOne({ staffId });

    if (!planning) {
      return res.status(404).json({ message: "Planning not found" });
    }

    // 1️⃣ Find unit
    const unit = planning.units.find(
      u => u.unitName.toLowerCase() === unitName.toLowerCase()
    );

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // 2️⃣ Find topic index
    const topicIndex = unit.topics.findIndex(
      t => t._id.toString() === topicId
    );

    if (topicIndex === -1) {
      return res.status(404).json({ message: "Topic not found" });
    }

    // 3️⃣ Remove topic
    unit.topics.splice(topicIndex, 1);

    // 4️⃣ Optional: re-number sno
    unit.topics.forEach((t, index) => {
      t.sno = index + 1;
    });

    planning.markModified("units");
    await planning.save();

    return res.status(200).json({
      message: "Topic deleted successfully",
    });

  } catch (error) {
    console.error("Delete Topic Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

