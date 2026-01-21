import SubjectPlanning from "../models/SubjectPlanning.js";

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

    const staffId = req.user.id; // from JWT

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

    // Find subject planning record
    let planning = await SubjectPlanning.findOne({
      staffId,
      subjectId,
    });

    // If first time → create
    if (!planning) {
      planning = new SubjectPlanning({
        staffId,
        subjectId,
        units: [],
      });
    }

    // Find unit
    let unit = planning.units.find((u) => u.unitName === unitName);

    if (!unit) {
      unit = {
        unitName,
        topics: [],
      };
      planning.units.push(unit);
    }

    const sno = unit.topics.length + 1;

    unit.topics.push({
      sno,
      topicName,
      teachingLanguage,
      date,
      hours,
      teachingAid,
      referenceBook,
    });

    planning.markModified("units");
    await planning.save();

    res.status(201).json({
      message: "Topic added successfully",
      unitName,
      topic: unit.topics[unit.topics.length - 1],
    });
  } catch (error) {
    console.error("Add Topic Error:", error);
    res.status(500).json({ message: error.message });
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

    const unit = planning.units.find((u) => u.unitName === unitName);
    if (!unit)
      return res.status(404).json({ message: "Unit not found" });

    const topic = unit.topics.id(topicId);
    if (!topic)
      return res.status(404).json({ message: "Topic not found" });

    // Update fields
    topic.topicName = topicName ?? topic.topicName;
    topic.teachingLanguage = teachingLanguage ?? topic.teachingLanguage;
    topic.date = date ?? topic.date;
    topic.hours = hours ?? topic.hours;
    topic.teachingAid = teachingAid ?? topic.teachingAid;
    topic.referenceBook = referenceBook ?? topic.referenceBook;

    planning.markModified("units");
    await planning.save();

    res.json({
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

    const unit = planning.units.find((u) => u.unitName === unitName);
    if (!unit)
      return res.status(404).json({ message: "Unit not found" });

    const topicIndex = unit.topics.findIndex(
      (t) => t._id.toString() === topicId
    );

    if (topicIndex === -1)
      return res.status(404).json({ message: "Topic not found" });

    unit.topics.splice(topicIndex, 1);

    // Re-number S.No
    unit.topics.forEach((t, index) => {
      t.sno = index + 1;
    });

    planning.markModified("units");
    await planning.save();

    res.json({
      message: "Topic deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
