// controllers/generatePdfController.js

import fs from 'fs';
import path from 'path';
import Course from '../models/CoursePlan.js';

export const getCourseHTML = async (req, res) => {
  try {
    const { subject_id, section_id } = req.params;

    const course = await Course.findOne({
      subjectId: subject_id,
      sectionId: section_id
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found for given subject & section'
      });
    }

    /* ===============================
       LOAD TEMPLATE FIRST ✅
    =============================== */

    const templatePath = path.join(
      process.cwd(),
      'html_templates',
      'course-plan.html'
    );

    const cssPath = path.join(
      process.cwd(),
      'html_templates',
      'course-plan.css'
    );

    let html = fs.readFileSync(templatePath, 'utf8');
    const css = fs.readFileSync(cssPath, 'utf8');
    html = html.replace('</head>', `<style>${css}</style></head>`);

    const pdf_title = `${course.courseCode} - ${course.courseTitle}`;
    html = html.replace('{{pdf_title}}', pdf_title);

    const logoPath = path.join(process.cwd(), 'images', 'College-Logo.png'); // Adjust to your actual disk path
    let logo_url = '';

    if (fs.existsSync(logoPath)) {
      const bitmap = fs.readFileSync(logoPath);
      const base64 = Buffer.from(bitmap).toString('base64');
      logo_url = `data:image/jpeg;base64,${base64}`;
    }

    html = html.replace('{{logo_url}}', logo_url);

    /* ===============================
       1️⃣ Course Outcomes Table
    =============================== */

    const generateCourseOutcomeRows = () => {
      const outcomes = course.courseDetails?.courseOutcomes || [];
      const courseCode = course.courseCode || '';

      return outcomes
        .map(
          (co, index) => `
        <tr>
          <td class="td">${courseCode}.${index + 1}</td>
          <td class="td">${co.statement || '-'}</td>
          <td class="td">${co.rtbl || '-'}</td>
        </tr>
      `
        )
        .join('');
    };

    /* ===============================
       2️⃣ CO-PO Mapping Table
    =============================== */

    const generateCoPoRows = () => {
      // Convert Mongoose doc to plain object to remove internal properties like $_, _doc
      const mapping = course.coPoMapping ? course.coPoMapping.toObject() : {};
      const courseCode = course.courseCode || '';

      // Update these to match your data keys exactly (PO0 vs PO1)
      const columns = [
        'PO1',
        'PO2',
        'PO3',
        'PO4',
        'PO5',
        'PO6',
        'PO7',
        'PO8',
        'PO9',
        'PO10',
        'PO11',
        'PSO1',
        'PSO2',
        'PSO3'
      ];

      let averages = {};
      columns.forEach((col) => (averages[col] = 0));

      // FILTER: Only take keys that start with "CO" and ignore Mongoose metadata
      const coKeys = Object.keys(mapping)
        .filter((key) => key.startsWith('CO'))
        .sort();

      const coCount = coKeys.length;

      let rows = coKeys
        .map((coKey) => {
          const coData = mapping[coKey] || {};

          const cells = columns
            .map((col) => {
              // Logic check: if your data uses PO0, you must change 'columns' or map it here
              const credit = coData[col]?.credit ?? 0;
              averages[col] += credit;
              return `<td class="td">${credit === 0 ? '0' : credit}</td>`;
            })
            .join('');

          return `
          <tr>
            <td class="td"><strong>${courseCode}.${coKey.replace('CO', '')}</strong></td>
            ${cells}
          </tr>
        `;
        })
        .join('');

      // Average row
      const avgCells = columns
        .map((col) => {
          const avg = coCount === 0 ? 0 : averages[col] / coCount;
          return `<td class="td"><strong>${Math.round(avg)}</strong></td>`;
        })
        .join('');

      rows += `<tr><td class="td"><strong>Average</strong></td>${avgCells}</tr>`;

      return rows;
    };

    /* ===============================
       3️⃣ Justification Table
    =============================== */

    const generateJustificationTable = () => {
      // 1. Convert to plain object to remove Mongoose internal properties
      const mapping = course.coPoMapping ? course.coPoMapping.toObject() : {};
      let rows = '';

      // 2. Filter keys to only process actual Course Outcomes (CO1, CO2, etc.)
      const coKeys = Object.keys(mapping)
        .filter((key) => key.startsWith('CO'))
        .sort();

      coKeys.forEach((coKey) => {
        let content = '';
        const coData = mapping[coKey] || {};

        // 3. Iterate through all PO/PSO keys in this CO
        Object.keys(coData).forEach((poKey) => {
          const j = coData[poKey]?.justification;

          // Ensure we only add non-empty justifications
          if (j && j.trim() !== '') {
            const cleaned = j.replace(/\n/g, '<br>').trim();
            content += `<p style="margin: 10px 0 10px 0"><strong>${poKey}:</strong> ${cleaned}</p>`;
          }
        });

        if (content) {
          rows += `
        <tr>
          <td class="td" style="vertical-align: top; width: 80px;"><strong>${coKey}</strong></td>
        <td style="padding: 0 10px 0 10px" class="td text-left">${content}</td>
        </tr>
      `;
        }
      });
      if (!rows) return '<p>Nil</p>';

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
          .join('') || '<li>Nil</li>';

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

    /* ===============================
    5️⃣ Dynamic Lesson Plan Generator
=============================== */
    /* ===============================
    5️⃣ Dynamic Lesson Plan Generator (FIXED)
=============================== */
    const generateLessonPlan = () => {
      // 1. Ensure we have a plain object, not a Mongoose internal Map
      const plannerData = course.theoryPlanner
        ? typeof course.theoryPlanner.toObject === 'function'
          ? course.theoryPlanner.toObject()
          : course.theoryPlanner
        : {};

      let rows = '';
      let globalSNo = 1;

      // 2. Get keys and sort them (UNIT1, UNIT2, etc.)
      const unitKeys = Object.keys(plannerData).sort((a, b) => {
        return parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''));
      });

      if (unitKeys.length === 0)
        return "<tr><td colspan='7'>No lesson plan data available.</td></tr>";

      // 3. Loop through each Unit
      unitKeys.forEach((unitKey) => {
        const unit = plannerData[unitKey];

        // Safety check: ensure the unit and topics exist
        if (!unit || !Array.isArray(unit.topics)) return;

        // Add the Unit Blue Sub-header
        rows += `
      <tr>
        <td colspan="7" class="unit-sub-header">
          <strong>${unit.title || unitKey}</strong>
        </td>
      </tr>
    `;

        // 4. Loop through topics inside this unit
        unit.topics.forEach((topic) => {
          // Extract number from key for CO (e.g., UNIT1 -> CO1)
          const coNum = unitKey.replace(/^\D+/g, '');

          rows += `
        <tr>
          <td>${globalSNo++}</td>
          <td>CO${coNum}</td>
          <td class="text-left">${topic.topicName || '-'}</td>
          <td>${topic.teachingAid || 'Interactive'}</td>
          <td>${topic.referenceBook || '-'}</td>
          <td>${topic.date || ''}</td>
          <td></td>
        </tr>
      `;
        });
      });

      return rows;
    };

    /* ===============================
    Dynamic Syllabus Generator
=============================== */
    /* ======================================================
    Dynamic Syllabus Generator (Cleaned & Prefixed)
   ====================================================== */
    const generateSyllabusTableRows = () => {
      const plannerData = course.theoryPlanner
        ? typeof course.theoryPlanner.toObject === 'function'
          ? course.theoryPlanner.toObject()
          : course.theoryPlanner
        : {};

      let rows = '';

      // Get and sort Unit keys (UNIT1, UNIT2, etc.)
      const unitKeys = Object.keys(plannerData).sort((a, b) => {
        return parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, ''));
      });

      unitKeys.forEach((unitKey) => {
        const unit = plannerData[unitKey];
        if (!unit) return;

        // 1. FILTER: Skip revisions, extra lessons, or "others"
        const unitTitle = (unit.title || '').trim().toUpperCase();
        if (
          unitTitle.includes('REVISION') ||
          unitTitle.includes('EXTRA') ||
          unitTitle.includes('OTHERS') ||
          unitTitle.includes('OTHER')
        ) {
          return; // Skip this iteration
        }

        // 2. Format Prefix (Convert UNIT1 to UNIT-I, UNIT2 to UNIT-II, etc.)
        const unitNum = parseInt(unitKey.replace(/\D/g, ''));
        const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
        const roman = romanNumerals[unitNum] || unitNum;

        // Create the clean header: UNIT-I: INTRODUCTION...
        const cleanHeader = `UNIT-${roman}: ${unit.title.replace(/UNIT\s*[IVX\d]*[:\s-]*/i, '').trim()}`;

        // 3. Sum topic hours
        const totalUnitHours = (unit.topics || []).reduce((sum, topic) => {
          return sum + (parseInt(topic.hours) || 0);
        }, 0);

        // 4. Combine topic names with a dash " - "
        const combinedTopics = (unit.topics || [])
          .map((t) => t.topicName)
          .filter(Boolean)
          .join(' - ');

        rows += `
      <tr>
        <td colspan="10" class="unit-row">
          <strong>${cleanHeader.toUpperCase()}</strong>
          <span style="float: right"><strong>(${totalUnitHours})</strong></span>
        </td>
      </tr>
      <tr>
        <td colspan="10" class="unit-content">
          ${combinedTopics || 'Nil'}
        </td>
      </tr>
    `;
      });

      return rows;
    };

    const generateDynamicReferenceRows = () => {
      const refs = course.references || {};

      const termWork = refs.termWork || {};
      const textBooks = refs.textBooks || [];
      const referenceBooks = refs.referenceBooks || [];
      const journals = refs.journals || [];
      const webResources = refs.webResources || [];
      const moocCourses = refs.moocCourses || [];

      const formatList = (arr, prefix) => {
        if (!arr.length) return 'Nil';

        return arr
          .map((item, i) => {
            const label = `${prefix}${i + 1}`;
            return `<p class="main-point"><strong>${label}.</strong> ${item}</p>`;
          })
          .join('');
      };

      const formatNormalList = (arr) => {
        if (!arr.length) return 'Nil';

        return arr
          .map((item, i) => `<p class="main-point">${i + 1}. ${item}</p>`)
          .join('');
      };

      const formatMooc = (arr) => {
        if (!arr.length) return 'Nil';

        return arr
          .map(
            (item, i) =>
              `<p class="main-point">${i + 1}. ${item.platform}: ${item.courseName} </p>`
          )
          .join(' ');
      };

      return `
        <tr>
          <td>
            <strong>Term Work (TW) Activities (Projects) — 60 Periods</strong>
          </td>
        </tr>

        <tr>
          <td>
            ${termWork.activity}
          </td>
        </tr>
        <tr>
          <td><strong>Text Books:</strong></td>
        </tr>
        <tr>
          <td>
            ${formatList(textBooks, 'T')}
          </td>
        </tr>

        <tr>
          <td><strong>References:</strong></td>
        </tr>

        <tr>
          <td>
            <strong>Reference Books:</strong>
            ${formatList(referenceBooks, 'R')}

            <strong>Journals:</strong>
            ${formatNormalList(journals)}

            <strong>Web Resources:</strong>
            ${formatNormalList(webResources)}

            <strong>MOOC/NPTEL/SWAYAM Courses:</strong>
            ${formatMooc(moocCourses)}
          </td>
        </tr>
      `;
    };

    const generateSampleProjects = () => {
      const refs = course.references || {};
      const projects = refs.projects || [];

      const generateRows = (arr) => {
        return arr
          .map((item, i) => `<p class="mt-2 mb-2">${i + 1}. ${item}</p>`)
          .join(' ');
      };
      return `
        <div class="mb-0 mt-0">
          ${generateRows(projects)}
        </div>
      `;
    };

    /* ===============================
       6️⃣ Objectives Bullet Format
    =============================== */

    const objectives = course.courseDetails?.courseObjectives || '';

    const formattedObjectives = objectives
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line, i) => `<p>${i + 1}. ${line}</p>`)
      .join('');

    /* ===============================
       7️⃣ Replace All Placeholders
    =============================== */

    html = html
      .replace(/{{academic_year}}/g, course.academicYear || '')
      .replace(/{{program}}/g, course.program || '')
      .replace(/{{course_code}}/g, course.courseCode || '')
      .replace(/{{course_title}}/g, course.courseTitle || '')
      .replace(/{{faculty_name}}/g, course.facultyName || '')
      .replace(/{{faculty_designation}}/g, course.facultyDesignation || '')
      .replace(/{{faculty_department}}/g, course.facultyDepartment || '')

      // Course Details
      .replace(/{{courseType}}/g, course.courseDetails?.courseType || '-')
      .replace(
        /{{preRequisites}}/g,
        course.courseDetails?.preRequisites || 'Nil'
      )
      .replace(/{{coRequisites}}/g, course.courseDetails?.coRequisites || 'Nil')
      .replace(
        /{{courseDescription}}/g,
        course.courseDetails?.courseDescription || 'Nil'
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
          ? course.references?.gapIdentification?.entry || 'Nil'
          : 'Nil'
      )

      .replace(/{{dynamic_reference_rows}}/g, generateDynamicReferenceRows())

      // Content Beyond Syllabus
      .replace(
        /{{contentBeyondSyllabus}}/g,
        course.references?.termWork?.enabled
          ? course.references?.termWork?.activity || 'Nil'
          : 'Nil'
      )

      // Lesson Plan
      .replace(/{{lessonPlanRows}}/g, generateLessonPlan())

      .replace(/{{sample_projects}}/g, generateSampleProjects())

      // Credit Values (Hardcoded or from Course Model)
      .replace(/{{credit_L}}/g, '2')
      .replace(/{{credit_T}}/g, '0')
      .replace(/{{credit_P}}/g, '2')
      .replace(/{{credit_J}}/g, '2')
      .replace(/{{credit_TW}}/g, '2')
      .replace(/{{credit_SL}}/g, '-')
      .replace(/{{credit_TH}}/g, '120')
      .replace(/{{credit_C}}/g, '4')

      // The Dynamic Syllabus Table Body
      .replace(/{{syllabus_rows}}/g, generateSyllabusTableRows());
    /* =============================== */

    res.status(200).send(html);
  } catch (error) {
    console.error('Error generating course plan HTML:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate HTML'
    });
  }
};
