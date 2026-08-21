'use server'
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import axios from 'axios';

// API configurations

const PROGRESS_API_URL = 'https://abc-api.edmingle.com/nuSource/api/v1/report/class/progress';
const BATCH_API_URL = 'https://abc-api.edmingle.com/nuSource/api/v1/masterbatch/classstudents';

// Function to format time
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

async function fetchAllPages(config, url = PROGRESS_API_URL) {
  let page = 1;
  let hasMorePages = true;
  let allUsers = [];
  let assessmentNames = [];
  let sectionColspan = [];
  let points = [];

  while (hasMorePages) {
    const response = await axios.get(url, {
      ...config,
      params: { ...config.params, page }
    });
    
    const jsonData = response.data;
    if (jsonData.code !== 200) {
      throw new Error('API response failed');
    }

    if (url === PROGRESS_API_URL) {
      allUsers = allUsers.concat(jsonData.class_report.user_details);
      if (page === 1) {
        assessmentNames = jsonData.class_report.assessment_names.filter(item => item[0] !== -1);
        sectionColspan = jsonData.class_report.section_colspan.filter(section => section.id);
        points = jsonData.class_report.points;
      }
      hasMorePages = jsonData.page_context.has_more_page;
    } else {
      allUsers = jsonData.students;
      hasMorePages = false;
    }
    page++;
  }

  return { allUsers, assessmentNames, sectionColspan, points };
}

export async function GET(request, { params }) {
  const { class_id, batch_id } = params;
  // const apikey = request.headers.get("X-API-Key");

  const apikey = "50d44cc7f3f7b1fa62e4c4c9c4d1ca04";
  // class_id = "591"
  // batch_id = "175"

  // API configurations with dynamic parameters
  const configDetailed = {
    headers: { 'apikey': apikey, 'ORGID': '3' },
    params: { class_id: class_id, page: 1, per_page: 10 }
  };

  const configAttempts = {
    headers: { 'apikey': apikey, 'ORGID': '3' },
    params: { class_id: class_id, page: 1, per_page: 10, material_required: 1 }
  };

  const configBatch = {
    headers: { 'apikey': apikey, 'ORGID': 3 },
    params: {
      sort_order: 'D',
      class_id: batch_id,
      master_batch_id: batch_id,
      get_certificate_data: 1,
      course_class_id: class_id,
      page: 1,
      per_page: 50
    }
  };

  try {
    // Fetch all data
    const detailedData = await fetchAllPages(configDetailed);
    const attemptsData = await fetchAllPages(configAttempts);
    const batchData = await fetchAllPages(configBatch, BATCH_API_URL);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Assessment Report
    const detailedWorksheetData = [];
    let detailedSectionRow = ['User Details'];
    detailedData.sectionColspan.forEach(section => {
      detailedSectionRow.push(section.name);
      for (let i = 1; i < section.colspan * 4; i++) detailedSectionRow.push('');
    });
    detailedSectionRow.push('');
    detailedWorksheetData.push(detailedSectionRow);

    let detailedAssessmentRow = [''];
    detailedData.assessmentNames.forEach(assessment => {
      detailedAssessmentRow.push(assessment[1]);
      detailedAssessmentRow.push('');
      detailedAssessmentRow.push('');
      detailedAssessmentRow.push('');
    });
    detailedAssessmentRow.push('');
    detailedWorksheetData.push(detailedAssessmentRow);

    const detailedHeaderRow = [
      'User Name',
      ...detailedData.assessmentNames.flatMap(() => ['Points', 'Marks', 'Attempts', 'Time Taken']),
      'Total Points'
    ];
    detailedWorksheetData.push(detailedHeaderRow);

    detailedData.allUsers.forEach(user => {
      const row = [user.user_name];
      const userExercises = user.user_marks.filter(mark => mark.exercise_id !== null);
      detailedData.assessmentNames.forEach(assessment => {
        const exerciseId = assessment[0];
        const userMark = userExercises.find(mark => mark.exercise_id === exerciseId) || {};
        row.push(userMark.marks || 0);
        row.push(`${userMark.marks || 0}/${userMark.total_marks || 0}`);
        row.push(userMark.no_of_attempts || 0);
        row.push(formatTime(userMark.total_time_taken || 0));
      });
      const totalPoints = user.user_marks.find(mark => mark.exercise_id === null)?.points || 0;
      row.push(totalPoints);
      detailedWorksheetData.push(row);
    });

    const detailedTotalRow = ['Grand Total'];
    detailedData.assessmentNames.forEach(() => detailedTotalRow.push('', '', '', ''));
    detailedTotalRow.push(detailedData.points[detailedData.points.length - 1]);
    detailedWorksheetData.push(detailedTotalRow);

    const detailedWorksheet = XLSX.utils.aoa_to_sheet(detailedWorksheetData);
    detailedWorksheet['!cols'] = [
      { wch: 20 },
      ...detailedData.assessmentNames.flatMap(() => [{ wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }]),
      { wch: 15 }
    ];
    detailedWorksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      ...detailedData.sectionColspan.map((section, index) => {
        const startCol = 1 + detailedData.sectionColspan.slice(0, index).reduce((sum, s) => sum + s.colspan * 4, 0);
        return { s: { r: 0, c: startCol }, e: { r: 0, c: startCol + (section.colspan * 4) - 1 } };
      }),
      ...detailedData.assessmentNames.map((_, index) => ({
        s: { r: 1, c: 1 + index * 4 }, e: { r: 1, c: 4 + index * 4 }
      }))
    ];
    XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Assessment Report');

    // Sheet 2: Content Report
    const attemptsWorksheetData = [];
    let attemptsSectionRow = ['User Details'];
    attemptsData.sectionColspan.forEach(section => {
      attemptsSectionRow.push(section.name);
      for (let i = 1; i < section.colspan; i++) attemptsSectionRow.push('');
    });
    attemptsSectionRow.push('');
    attemptsWorksheetData.push(attemptsSectionRow);

    const attemptsHeaderRow = [
      'User Name',
      ...attemptsData.assessmentNames.map(assessment => `${assessment[1]} (Attempts)`),
      'Total Attempts'
    ];
    attemptsWorksheetData.push(attemptsHeaderRow);

    attemptsData.allUsers.forEach(user => {
      const row = [user.user_name];
      let totalAttempts = 0;
      attemptsData.assessmentNames.forEach((assessment, index) => {
        const userMark = user.user_marks[index] || {};
        const attempts = parseInt(userMark.no_of_attempts) || 0;
        row.push(attempts);
        totalAttempts += attempts;
      });
      row.push(totalAttempts);
      attemptsWorksheetData.push(row);
    });

    const attemptsWorksheet = XLSX.utils.aoa_to_sheet(attemptsWorksheetData);
    attemptsWorksheet['!cols'] = [
      { wch: 20 },
      ...attemptsData.assessmentNames.map(() => ({ wch: 15 })),
      { wch: 15 }
    ];
    attemptsWorksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } },
      ...attemptsData.sectionColspan.map((section, index) => {
        const startCol = 1 + attemptsData.sectionColspan.slice(0, index).reduce((sum, s) => sum + s.colspan, 0);
        return { s: { r: 0, c: startCol }, e: { r: 0, c: startCol + section.colspan - 1 } };
      })
    ];
    XLSX.utils.book_append_sheet(workbook, attemptsWorksheet, 'Content Report');

    // Sheet 3: Batch Progress
    const batchResponse = await axios.get(BATCH_API_URL, configBatch);
    const batchJsonData = batchResponse.data;
    const batchWorksheetData = [['Name', 'Email', 'Progress (%)', 'Batch Name', 'Course Name']];
    
    const BatchName = batchJsonData.class.master_batch_name;
    const classArray = batchJsonData.class.class.filter(i => i.class_id === parseInt(class_id));
    const courseName = classArray[0].class_name;

    batchData.allUsers.forEach(student => {
      const row = [
        student.name,
        student.email,
        student.progress[0],
        BatchName,
        courseName
      ];
      batchWorksheetData.push(row);
    });

    const batchWorksheet = XLSX.utils.aoa_to_sheet(batchWorksheetData);
    batchWorksheet['!cols'] = [
      { wch: 20 },
      { wch: 30 },
      { wch: 15 },
      { wch: 25 },
      { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(workbook, batchWorksheet, 'Batch Progress');

    // Generate Excel file buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const timestamp = new Date().toISOString().replace(/:/g, '-');

    // Return the file as a response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="Student_Analytics_${timestamp}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: error.response?.status || 500 }
    );
  }
}