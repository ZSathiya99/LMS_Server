import Question from "../models/Question.js";
import fs from "fs";
import path from "path";


// ======================================================
// ✅ POST - Create Question (Form-Data)
// ======================================================
export const createQuestion = async (req, res) => {
  try {
    const staffId = req.user.facultyId;

    const {
      subjectId,
      title,
      questionType,
      instruction,
      dueDate,
      link,
      youtubeLink,
      options,
      marks, // 🔥 ADD
    } = req.body;

    // ✅ Validation
    if (!subjectId || !title || !questionType || !marks) {
      return res.status(400).json({
        message: "subjectId, title, questionType and marks are required",
      });
    }

    if (Number(marks) <= 0) {
      return res.status(400).json({
        message: "Marks must be greater than 0",
      });
    }

    const attachments = req.files
      ? req.files.map((file) => file.filename)
      : [];

    let formattedOptions = [];

    // ✅ MCQ handling
    if (
      questionType === "Single Choice" ||
      questionType === "Multiple Choice"
    ) {
      if (!options) {
        return res.status(400).json({
          message: "Options are required for choice questions",
        });
      }

      const parsedOptions =
        typeof options === "string" ? JSON.parse(options) : options;

      formattedOptions = parsedOptions.map((opt) => ({
        text: opt,
      }));
    }

    const question = await Question.create({
      subjectId,
      staffId,
      title,
      questionType,
      instruction,
      attachments,
      options: formattedOptions,
      link,
      youtubeLink,
      marks: Number(marks), // 🔥 SAVE MARKS
      dueDate,
    });

    return res.status(201).json({
      message: "Question created successfully",
      data: question,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};






// ======================================================
// ✅ GET - Get All Questions (By Subject)
// ======================================================
export const getQuestions = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const questions = await Question.find({ subjectId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: questions.length,
      data: questions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ======================================================
// ✅ GET - Single Question
// ======================================================
export const getSingleQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({ data: question });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ======================================================
// ✅ PUT - Update Question (Form-Data + Options Support)
// ======================================================
export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const staffId = req.user.facultyId;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Only creator can update
    if (question.staffId.toString() !== staffId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const {
      title,
      questionType,
      instruction,
      dueDate,
      link,
      youtubeLink,
      options,
    } = req.body;

    // ===============================
    // ✅ Basic Field Updates
    // ===============================
    if (title) question.title = title;
    if (instruction) question.instruction = instruction;
    if (dueDate) question.dueDate = dueDate;

    if (link !== undefined) question.link = link;
    if (youtubeLink !== undefined) question.youtubeLink = youtubeLink;

    // ===============================
    // ✅ Handle Question Type Change
    // ===============================
    if (questionType) {
      question.questionType = questionType;
    }

    // ===============================
    // ✅ Handle Options (MCQ)
    // ===============================
    if (
      question.questionType === "Single Choice" ||
      question.questionType === "Multiple Choice"
    ) {
      if (options) {
        let parsedOptions;

        try {
          parsedOptions =
            typeof options === "string" ? JSON.parse(options) : options;
        } catch (err) {
          return res.status(400).json({
            message: "Options must be valid JSON array",
          });
        }

        question.options = parsedOptions.map((opt) => ({
          text: opt,
        }));
      }
    } else {
      // If changed to Descriptive → remove options
      question.options = [];
    }

    // ===============================
    // ✅ File Update (Replace Files)
    // ===============================
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((file) => file.filename);
      question.attachments = newFiles;
    }

    await question.save();

    res.status(200).json({
      message: "Question updated successfully",
      data: question,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// ======================================================
// ✅ DELETE - Delete Question (Also delete files)
// ======================================================
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const staffId = req.user.facultyId;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Only creator can delete
    if (question.staffId.toString() !== staffId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // delete attached files
    question.attachments.forEach((file) => {
      const filePath = path.join("uploads", file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Question.findByIdAndDelete(questionId);

    res.status(200).json({
      message: "Question deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
