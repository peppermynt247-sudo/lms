import api from "@/services/api";

export const assignmentData = async (id) => { try {
    const res = await api.get(`/api/exercises/${id}`);
    return res.data.data; 
  } catch (err) {
    console.error("Error fetching assignment data:", err);
    return null;
  }
}

export const courseData = async (id) => {
  try {
    const res = await api.get(`/api/courses/${id}/header`);
    return res.data;
  } catch (err) {
    console.error("Error fetching course data:", err);
    return null;
  }
}
export const curriculumData = async (courseId, curriculumId) => {
  try {
    const res = await api.get(`/api/courses/${courseId}/curriculums/${curriculumId}/student-view`);
    return res.data;
  } catch (err) {
    console.error("Error fetching curriculum data:", err);
    return null;
  }
}

export const contentItems = async (sectionId) => {
  try {
    const res = await api.get(`/api/curriculumsections/${sectionId}/content`);
    return res.data;
  } catch (err) {
    console.error("Error fetching content items:", err);
    return null;
  }
}

export const AssignmentAttempts = async (id, userId) => {
  try {
    const res = await api.get(`/api/exercises/${id}/attempts?userId=${userId}`);
    return res.data.data;
  } catch (err) {
    console.error("Error fetching assignment attempts:", err);
    return null;
  }
};

export const backendQuestions = (id) => {
  return api.get(`/api/question-banks/${id}/questions`);
};

/**
 * Fetches questions for an exercise using the student-safe endpoint.
 * Returns List<StudentTestDTO.StudentQuestion> — correct answers are stripped.
 * STUDENT role is allowed. Use this instead of backendQuestions() in the student portal.
 */
export const getExerciseQuestions = (exerciseId) => {
  return api.get(`/api/exercises/${exerciseId}/questions`);
};

export const attemptNow = (id, contentItemId) => {
  return api.post(`/api/exercises/${id}/start`, { contentItemId });
};

export const saveAnswer = (attemptId, payload) => {
  return api.post(`/api/exercises/attempts/${attemptId}/answer`, payload);
};

export const getAttemptProgress = (attemptId) => {
  return api.get(`/api/exercises/attempts/${attemptId}/progress`);
};

export const submitResponses = (assignmentId, payload) => {
  return api.post(`/api/exercises/attempts/${assignmentId}/complete`, payload);
};

export const getQuestionBankId = async (exerciseID) => {
  try {
    const res = await api.get(`/api/exercises/${exerciseID}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching question bank ID:", err);
    return null;
  }
};

export const getAttemptResult = (attemptId, userID) => {
  const res = api.get(`/api/exercises/attempts/${attemptId}?userId=${userID}`);
  return res;
};
