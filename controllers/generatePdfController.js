import { table } from "console";
import fs from "fs";
import path from "path";
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
    const cssPath = path.join(
      process.cwd(),
      "html_templates",
      "course-plan.css",
    );

    const generateJustificationTable = (data) => {
      let rows = "";

      data.forEach((co) => {
        const mappingContent = co.mappings
          .map(
            (item) => `
          <p><strong>${item.code}:</strong> ${item.text}</p>
        `,
          )
          .join("");

        rows += `
      <tr>
        <td class="co-column td">${co.coNumber}</td>
        <td class="justification-column td">
          ${mappingContent}
        </td>
      </tr>
    `;
      });

      return `
           <ul class="left-text">
          <li>
            <strong>8.8 CO-PO Mapping Justification:</strong>
          </li>
        </ul>
    <table class="justification-table table">
      <thead>
        <tr>
          <th>CO #</th>
          <th>Justification for mapping with PO</th>
        </tr>
      </thead>
      <tbody>
        ${rows} 
      </tbody>
    </table>
  `;
    };

    let html = fs.readFileSync(templatePath, "utf8");
    const css = fs.readFileSync(cssPath, "utf8");

    // for getting the port / url of the production backend : eg => localhost:5000 or backendOnRender.com
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    html = html.replace("</head>", `<style>${css}</style></head>`);

    html = html
      .replace(/{{name}}/g, "Nishanth")
      .replace(/{{department}}/g, "Information technology")
      .replace(/{{pdf_title}}/g, "Java programming")
      .replace(/{{logo_url}}/g, `${baseUrl}/pdf_assets/logo.png`);

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
