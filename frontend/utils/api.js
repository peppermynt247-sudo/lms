import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_BACKEND_REST_API_BASE_URL ||
    'https://atomslmsapi.abc.courses/atoms',
});

api.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('authToken');
  }
  if (!token) {
    token = Cookies.get('accessToken');
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        Cookies.remove('accessToken');
        Cookies.remove('userEmail');
        Cookies.remove('userId');
        Cookies.remove('JSESSIONID');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Curriculum ────────────────────────────────────────────────────────────

export const getCurriculumSections = async (curriculumId) => {
  const response = await api.get('/api/curriculumsections', {
    params: { curriculumId },
  });
  return response.data;
};

export const addCurriculumSection = async (curriculumId, sectionData) => {
  const response = await api.post('/api/curriculumsections', sectionData, {
    params: { curriculumId },
  });
  return response.data;
};

export const getCurriculumById = async (curriculumId) => {
  const response = await api.get(`/api/curriculums/${curriculumId}`);
  return response.data;
};

export const deleteCurriculum = async (curriculumId) => {
  const response = await api.delete(`/api/curriculums/${curriculumId}`);
  return response.data;
};

// ─── Question Banks ────────────────────────────────────────────────────────

export const getAllQuestionBanks = async () => {
  const response = await api.get('/api/question-banks');
  return response.data;
};

// ─── Exercises ────────────────────────────────────────────────────────────

export const createExerciseForSection = async (sectionId, exerciseData) => {
  const response = await api.post(
    `/api/curriculum-sections/${sectionId}/exercises`,
    exerciseData
  );
  return response.data;
};

export const updateExerciseForSection = async (exerciseId, exerciseData) => {
  const response = await api.put(`/api/exercises/${exerciseId}`, exerciseData);
  return response.data;
};

export const deleteExercise = async (exerciseId) => {
  return api.delete(`/api/exercises/${exerciseId}`);
};

export async function getExerciseById(id) {
  return api.get(`/api/exercises/${id}`);
}

// ─── Coding Exercises ─────────────────────────────────────────────────────

export const createCodingExercise = async (curriculumSectionId, exerciseData) => {
  const response = await api.post('/api/codingexercise', exerciseData, {
    params: { curriculumsectionId: curriculumSectionId },
  });
  return response.data;
};

export const deleteCodingExercise = async (id) => {
  return api.delete(`/api/codingexercise/${id}`);
};

export async function getCodingExerciseById(id) {
  return api.get(`/api/codingexercise/${id}`);
}

export async function updateCodingExercise(id, exerciseData) {
  return api.put(`/api/codingexercise/${id}`, exerciseData);
}

// ─── Content ───────────────────────────────────────────────────────────────

export const getSectionContent = async (sectionId) => {
  const response = await api.get(
    `/api/curriculum-sections/${sectionId}/content`
  );
  return response.data;
};

export async function handleDeleteMaterial(contentItemId, referenceId, contentType = null, isYoutube = false) {
  const type = contentType ? contentType.toLowerCase() : '';
  let specificEndpoint = null;

  if (type === 'video') {
    specificEndpoint = isYoutube && referenceId ? `/api/video/deleteyoutube/${referenceId}` : `/api/video/${referenceId}/delete`;
  } else if (type === 'exercise' && referenceId) {
    specificEndpoint = `/api/exercises/${referenceId}`;
  } else if ((type === 'elab' || type === 'programming') && referenceId) {
    specificEndpoint = `/api/codingexercise/${referenceId}`;
  } else if (type === 'ebook' && referenceId) {
    specificEndpoint = `/api/ebooks/${referenceId}`;
  }

  try {
    if (specificEndpoint) {
      const specRes = await api.delete(specificEndpoint);
      if (specRes.status === 200 || specRes.status === 204) {
        return toast.success('Material deleted successfully');
      }
    }
  } catch (err) {
    // Stop the unsafe fallback and gracefully propagate the API validation error.
    // Explicitly omitting console.error to bypass the intrusive Next.js Dev overlay.
    throw err;
  }

  // Fallback / Universal Deletion - utilizes the primary key of ContentItem row
  try {
    const response = await api.delete(`/api/content-items/${contentItemId}`);
    if (response.status === 200 || response.status === 204) {
      return toast.success('Material deleted successfully');
    }
  } catch (fallbackErr) {
    return toast.error('Failed to delete material');
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

export async function getTestById(id) {
  return api.get(`/api/tests/${id}`);
}

export default api;
