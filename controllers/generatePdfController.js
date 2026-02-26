import fs from "fs";
import path from "path";

// create a model to store the data's
// import Course from "../models/Course.js";

export const getCourseHTML = async (req, res) => {
  try {
    // get the id from the params
    // const { subject_id } = req.params;

    // find the course plan using subject_id
    // const course = await Course.findById(subject_id);

    // throw error if course plan does'nt exisit
    // if (!course) {
    //   return res.status(404).json({ message: "Course not found" });
    // }

    const templatePath = path.join(
      process.cwd(),
      "html_templates",
      "course-plan.html",
    );

    let html = fs.readFileSync(templatePath, "utf8");

    html = html
      .replace("{{name}}", "Nishanth")
      .replace("{{department}}", "Information technology");

    res.send(html);
  } catch (err) {
    console.error("Error occured while generating course plan pdf : ", err);
    res.status(500).json({
      message: "Failed to generatre HTML",
    });
  }
};
