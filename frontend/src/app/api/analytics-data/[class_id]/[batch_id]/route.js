'use server'
import { NextResponse } from 'next/server';
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

  var mcq_marks;
  var tf_marks;
  var total;

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
    const batchResponse = await axios.get(BATCH_API_URL, configBatch);
    const batchJsonData = batchResponse.data;

    // Get batch and course names
    const batchName = batchJsonData.class.master_batch_name;
    const courseName = batchJsonData.class.class.find(i => i.class_id === parseInt(class_id)).class_name;

    // Create a map of sectionColspan id to index for sorting
    const sectionOrder = new Map();
    detailedData.sectionColspan.forEach((section, index) => {
      sectionOrder.set(section.id, index);
    });

    // Sort assessmentNames based on sectionColspan order
    const sortedAssessmentNames = detailedData.assessmentNames.sort((a, b) => {
      const sectionA = sectionOrder.get(String(a[0])) ?? Infinity;
      const sectionB = sectionOrder.get(String(b[0])) ?? Infinity;
      return sectionA - sectionB;
    });

    // Create a map of users for easier lookup
    const userMap = new Map();

    // Process detailed data (assessment report)
    detailedData.allUsers.forEach(user => {
      const userExercises = user.user_marks.filter(mark => mark.exercise_id !== null);
      const assessments = sortedAssessmentNames.map(assessment => {
        const exerciseId = assessment[0];
        const userMark = userExercises.find(mark => mark.exercise_id === exerciseId) || {};
        if(assessment[1] === 'MCQ') {
          mcq_marks =+ userMark.total_marks || 0;
        }else{
          tf_marks =+ userMark.total_marks || 0;
        }
        return {
          exerciseId,
          name: assessment[1],
          marks: userMark.marks || 0,
          totalMarks: userMark.total_marks,
          obtained_marks: `${userMark.marks || 0}/${userMark.total_marks}`,
          attempts: userMark.no_of_attempts || 0,
          timeTaken: formatTime(userMark.total_time_taken || 0)
        };
      });
      let totalPoints = 0;
      assessments.forEach(assessment => {
        totalPoints += parseFloat(assessment.totalMarks);
      });
      // var totalPoints = user.user_marks.reduce((total, mark) => total + parseFloat(mark.total_marks), 0);

      userMap.set(user.user_name, {
        name: user.user_name,
        assessments: { items: assessments, totalPoints },
        content: { items: [], totalAttempts: 0 },
        batch: { email: '', progress: 0, batchName, courseName }
      });
    });

    // Process attempts data (content report)
    const sortedAttemptsAssessmentNames = attemptsData.assessmentNames.sort((a, b) => {
      const sectionA = sectionOrder.get(String(a[0])) ?? Infinity;
      const sectionB = sectionOrder.get(String(b[0])) ?? Infinity;
      return sectionA - sectionB;
    });

    attemptsData.allUsers.forEach(user => {
      let totalAttempts = 0;
      const contentItems = sortedAttemptsAssessmentNames.map(assessment => {
        const exerciseId = assessment[0];
        const userMark = user.user_marks.find(mark => mark.exercise_id === exerciseId) || {};
        const attempts = parseInt(userMark.no_of_attempts) || 0;
        totalAttempts += attempts;
        return {
          exerciseId,
          name: assessment[1],
          attempts
        };
      });

      if (userMap.has(user.user_name)) {
        userMap.get(user.user_name).content = { items: contentItems, totalAttempts };
      } else {
        userMap.set(user.user_name, {
          name: user.user_name,
          assessments: { items: [], totalPoints: 0 },
          content: { items: contentItems, totalAttempts },
          batch: { email: '', progress: 0, batchName, courseName }
        });
      }
    });

    // Process batch data
    batchJsonData.students.forEach(student => {
      if (userMap.has(student.name)) {
        userMap.get(student.name).batch = {
          email: student.email,
          progress: student.progress[0],
          batchName,
          courseName
        };
      } else {
        userMap.set(student.name, {
          name: student.name,
          assessments: { items: [], totalPoints: 0 },
          content: { items: [], totalAttempts: 0 },
          batch: {
            email: student.email,
            progress: student.progress[0],
            batchName,
            courseName
          }
        });
      }
    });

    // Convert userMap to array and add metadata
    const users = Array.from(userMap.values());
    const metadata = {
      assessments: {
        sectionColspan: detailedData.sectionColspan,
        totalPoints: detailedData.points[detailedData.points.length - 1]
      },
      content: {
        sectionColspan: attemptsData.sectionColspan
      }
    };

    return NextResponse.json({ users, metadata }, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { error: error.message, details: error.response?.data },
      { status: error.response?.status || 500 }
    );
  }
}