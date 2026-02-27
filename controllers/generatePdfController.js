// this is my testing branch for generating the pdf using html 
import { table } from "console";
import fs from "fs";
import path from "path";
import Course from "../models/";
const justifications = [
  {
    coNumber: "CO 1",
    mappings: [
      {
        code: "PO1",
        text: "Applies engineering knowledge to implement data acquisition techniques such as web scraping and API-based data collection.",
      },
      {
        code: "PO2",
        text: "Identifies and formulates strategies to extract and preprocess structured and unstructured data from various sources.",
      },
      {
        code: "PO3",
        text: "Designs systematic pipelines and approaches for efficient data acquisition and preprocessing.",
      },
      {
        code: "PO4",
        text: "Conducts investigations to ensure data completeness, integrity, and reliability before analysis.",
      },
      {
        code: "PSO1",
        text: "Demonstrates the use of open-source tools and libraries for data acquisition and preprocessing tasks.",
      },
    ],
  },
  {
    coNumber: "CO 2",
    mappings: [
      {
        code: "PO1",
        text: "Applies core computing and engineering knowledge to analyze datasets and understand data characteristics.",
      },
      {
        code: "PO2",
        text: "Analyzes complex data-related problems and selects appropriate preprocessing and transformation techniques.",
      },
      {
        code: "PO3",
        text: "Designs effective data preprocessing workflows to support further analysis and modeling.",
      },
      {
        code: "PO4",
        text: "Performs investigative analysis to validate data quality and assess preprocessing outcomes.",
      },
      {
        code: "PSO1",
        text: "Uses open-source platforms and frameworks for data cleaning and transformation.",
      },
    ],
  },
];
// create a model to store the data's
// import Course from "../models/Course.js";



export const getCourseHTML = async (req, res) => {
  try {
    const { subject_id } = req.params;

    const course = await Course.findById(subject_id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const templatePath = path.join(
      process.cwd(),
      "html_templates",
      "course-plan.html",
    );
    const cssPath = path.join(
      process.cwd(),
      "html_templates",
      "course-plan.css",
    );

    const generateCoPoMappingTable = (coPoMapping) => {
  let rows = "";

  Object.keys(coPoMapping).forEach((coKey) => {
    const mapping = coPoMapping[coKey];

    let cells = "";

    Object.keys(mapping).forEach((poKey) => {
      const credit = mapping[poKey].credit;
      cells += `<td class="td">${credit === 0 ? "-" : credit}</td>`;
    });

    rows += `
      <tr>
        <td class="td">${coKey}</td>
        ${cells}
      </tr>
    `;
  });

  return rows;
};

    let html = fs.readFileSync(templatePath, "utf8");
    const css = fs.readFileSync(cssPath, "utf8");

    // for getting the port / url of the production backend : eg => localhost:5000 or backendOnRender.com
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    html = html.replace("</head>", `<style>${css}</style></head>`);

    html = html;
    html = html
      .replace(/{{academic_year}}/g, course.academicYear)
      .replace(/{{program}}/g, course.program)
      .replace(/{{course_code}}/g, course.courseCode)
      .replace(/{{course_title}}/g, course.courseTitle)
      .replace(/{{faculty_name}}/g, course.facultyName)
      .replace(/{{faculty_designation}}/g, course.facultyDesignation)
      .replace(/{{faculty_department}}/g, course.facultyDepartment);

    const justificationHTML = generateJustificationTable(justifications);

    html = html.replace(
      `<div class="justification-container"></div>`,
      `<div class="justification-container">${justificationHTML}</div>`,
    );
    res.send(html);
  } catch (err) {
    console.error("Error occured while generating course plan pdf : ", err);
    res.status(500).json({
      message: "Failed to generatre HTML",
    });
  }
};
