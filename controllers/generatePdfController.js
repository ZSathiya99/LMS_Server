// controllers/generatePdfController.js

import fs from "fs";
import path from "path";
import Course from "../models/CoursePlan.js";

export const getCourseHTML = async (req, res) => {
  try {
    const { subject_id, section_id } = req.params;

    const course = await Course.findOne({
      subjectId: subject_id,
      sectionId: section_id,
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found for given subject & section",
      });
    }

    /* ===============================
       LOAD TEMPLATE FIRST ✅
    =============================== */

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

    let html = fs.readFileSync(templatePath, "utf8");
    const css = fs.readFileSync(cssPath, "utf8");
    html = html.replace("</head>", `<style>${css}</style></head>`);

    const pdf_title = `${course.courseCode} - ${course.courseTitle}`;
    html = html.replace("{{pdf_title}}", pdf_title);

    const logoPath = path.join(process.cwd(), 'images', 'College-Logo.png'); // Adjust to your actual disk path
    let logo_url = "";
    
    if (fs.existsSync(logoPath)) {
      const bitmap = fs.readFileSync(logoPath);
      const base64 = Buffer.from(bitmap).toString('base64');
      logo_url = `data:image/jpeg;base64,${base64}`;
    }

    html = html.replace("{{logo_url}}", logo_url);

    /* ===============================
       1️⃣ Course Outcomes Table
    =============================== */

    const generateCourseOutcomeRows = () => {
      const outcomes = course.courseDetails?.courseOutcomes || [];
      const courseCode = course.courseCode || "";

      return outcomes
        .map(
          (co, index) => `
        <tr>
          <td class="td">${courseCode}.${index + 1}</td>
          <td class="td">${co.statement || "-"}</td>
          <td class="td">${co.rtbl || "-"}</td>
        </tr>
      `,
        )
        .join("");
    };

    /* ===============================
       2️⃣ CO-PO Mapping Table
    =============================== */

    const generateCoPoRows = () => {
      // Convert Mongoose doc to plain object to remove internal properties like $_, _doc
      const mapping = course.coPoMapping ? course.coPoMapping.toObject() : {};
      const courseCode = course.courseCode || "";

      // Update these to match your data keys exactly (PO0 vs PO1)
      const columns = [
        "PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", 
        "PO8", "PO9", "PO10", "PO11", "PSO1", "PSO2", "PSO3",
      ];

      let averages = {};
      columns.forEach((col) => (averages[col] = 0));

      // FILTER: Only take keys that start with "CO" and ignore Mongoose metadata
      const coKeys = Object.keys(mapping)
        .filter(key => key.startsWith("CO"))
        .sort(); 
        
      const coCount = coKeys.length;

      let rows = coKeys.map((coKey) => {
        const coData = mapping[coKey] || {};

        const cells = columns.map((col) => {
          // Logic check: if your data uses PO0, you must change 'columns' or map it here
          const credit = coData[col]?.credit ?? 0;
          averages[col] += credit;
          return `<td class="td">${credit === 0 ? "0" : credit}</td>`;
        }).join("");

        return `
          <tr>
            <td class="td"><strong>${courseCode}.${coKey.replace("CO", "")}</strong></td>
            ${cells}
          </tr>
        `;
      }).join("");

      // Average row
      const avgCells = columns.map((col) => {
        const avg = coCount === 0 ? 0 : averages[col] / coCount;
        return `<td class="td"><strong>${Math.round(avg)}</strong></td>`;
      }).join("");

      rows += `<tr><td class="td"><strong>Average</strong></td>${avgCells}</tr>`;

      return rows;
    };

    /* ===============================
       3️⃣ Justification Table
    =============================== */

    const generateJustificationTable = () => {
  // 1. Convert to plain object to remove Mongoose internal properties
  const mapping = course.coPoMapping ? course.coPoMapping.toObject() : {};
  let rows = "";

  // 2. Filter keys to only process actual Course Outcomes (CO1, CO2, etc.)
  const coKeys = Object.keys(mapping)
    .filter((key) => key.startsWith("CO"))
    .sort();

  coKeys.forEach((coKey) => {
    let content = "";
    const coData = mapping[coKey] || {};

    // 3. Iterate through all PO/PSO keys in this CO
    Object.keys(coData).forEach((poKey) => {
      const j = coData[poKey]?.justification;

      // Ensure we only add non-empty justifications
      if (j && j.trim() !== "") {
        const cleaned = j.replace(/\n/g, "<br>").trim();
        content += `<p><strong>${poKey}:</strong> ${cleaned}</p>`;
      }
    });

    if (content) {
      rows += `
        <tr>
          <td class="td" style="vertical-align: top; width: 80px;"><strong>${coKey}</strong></td>
        <td class="td text-left">${content}</td>
        </tr>
      `;
    }
  });
  if (!rows) return "<p>Nil</p>";

  return `
    <table class="table" style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr class="tab-header">
          <th class="th">CO</th>
          <th class="th">Justification</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

    /* ===============================
       4️⃣ References Section
    =============================== */

    const generateReferences = () => {
      const refs = course.references || {};

      const list = (arr) =>
        arr
          ?.filter(Boolean)
          .map((i) => `<li>${i}</li>`)
          .join("") || "<li>Nil</li>";

      return `
        <h4>Text Books</h4>
        <ul>${list(refs.textBooks)}</ul>

        <h4>Reference Books</h4>
        <ul>${list(refs.referenceBooks)}</ul>

        <h4>Journals</h4>
        <ul>${list(refs.journals)}</ul>

        <h4>Web Resources</h4>
        <ul>${list(refs.webResources)}</ul>
      `;
    };

    /* ===============================
       5️⃣ Lesson Plan
    =============================== */

    const generateLessonPlan = () => {
      const planner = course.theoryPlanner || [];

      if (!planner.length) return "<tr><td colspan='6'>Nil</td></tr>";

      return planner
        .map(
          (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.topicName}</td>
          <td>${item.teachingLanguage}</td>
          <td>${item.referenceBook}</td>
          <td>${item.date}</td>
          <td>${item.teachingAid}</td>
        </tr>
      `,
        )
        .join("");
    };

    /* ===============================
       6️⃣ Objectives Bullet Format
    =============================== */

    const objectives = course.courseDetails?.courseObjectives || "";

    const formattedObjectives = objectives
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => `<li>${line}</li>`)
      .join("");

    /* ===============================
       7️⃣ Replace All Placeholders
    =============================== */

    html = html
      .replace(/{{academic_year}}/g, course.academicYear || "")
      .replace(/{{program}}/g, course.program || "")
      .replace(/{{course_code}}/g, course.courseCode || "")
      .replace(/{{course_title}}/g, course.courseTitle || "")
      .replace(/{{faculty_name}}/g, course.facultyName || "")
      .replace(/{{faculty_designation}}/g, course.facultyDesignation || "")
      .replace(/{{faculty_department}}/g, course.facultyDepartment || "")

      // Course Details
      .replace(/{{courseType}}/g, course.courseDetails?.courseType || "-")
      .replace(
        /{{preRequisites}}/g,
        course.courseDetails?.preRequisites || "Nil",
      )
      .replace(/{{coRequisites}}/g, course.courseDetails?.coRequisites || "Nil")
      .replace(
        /{{courseDescription}}/g,
        course.courseDetails?.courseDescription || "Nil",
      )

      // Objectives
      .replace(/{{courseObjectives}}/g, `<ul>${formattedObjectives}</ul>`)

      // Tables
      .replace(/{{course_outcomes_rows}}/g, generateCourseOutcomeRows())
      .replace(/{{co_po_rows}}/g, generateCoPoRows())

      // Justification
      .replace(/{{coPoJustification}}/g, generateJustificationTable())

      // References
      .replace(/{{referencesSection}}/g, generateReferences())

      // Gap Identification
      .replace(
        /{{gapIdentification}}/g,
        course.references?.gapIdentification?.enabled
          ? course.references?.gapIdentification?.entry || "Nil"
          : "Nil",
      )

      // Content Beyond Syllabus
      .replace(
        /{{contentBeyondSyllabus}}/g,
        course.references?.termWork?.enabled
          ? course.references?.termWork?.activity || "Nil"
          : "Nil",
      )

      // Lesson Plan
      .replace(/{{lessonPlanRows}}/g, generateLessonPlan());
    /* =============================== */

    res.status(200).send(html);
  } catch (error) {
    console.error("Error generating course plan HTML:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate HTML",
    });
  }
};
