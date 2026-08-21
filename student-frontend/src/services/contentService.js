import api from './api';

// Content progress service
export const updateContentProgress = async (contentItemId, progressPercentage) => {
  try {
    await api.post('/api/content-progress/update', {
      contentItemId,
      progressPercentage,
      timeSpentSeconds: 0,
    });
  } catch (error) {
    console.error('Failed to update content progress:', error);
  }
};

// Video content service
export const getVideoPlaybackData = async (videoId) => {
  try {
    const response = await api.get(`/api/video/${videoId}/playback`);
    return response.data;
  } catch (error) {
    console.error("Video playback API error:", error);
    if (error.response?.status === 404) {
      throw new Error('Video not found');
    } else if (error.response?.status === 401) {
      throw new Error('Unauthorized access to video');
    } else {
      throw new Error('Failed to fetch video playback data');
    }
  }
};

// Ebook content service
export const getEbookData = async (ebookId) => {
  try {
    const response = await api.get(`/api/ebooks/${ebookId}`);
    return response.data;
  } catch (error) {
    console.error("eBook API error:", error);
    if (error.response?.status === 404) {
      throw new Error('eBook not found');
    } else if (error.response?.status === 401) {
      throw new Error('Unauthorized access to eBook');
    } else {
      throw new Error('Failed to fetch ebook data');
    }
  }
};

// Course content service
export const getCourseContent = async (courseId) => {
  try {
    const response = await api.get(`/api/courses/${courseId}/content`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch course content');
  }
};

// Curriculum sections service
export const getCurriculumSections = async (curriculumId) => {
  try {
    const response = await api.get(`/api/curriculumsections?curriculumId=${curriculumId}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch curriculum sections');
  }
};

const contentService = {
  // getVideoPlaybackData,
  getEbookData,
  getCourseContent,
  getCurriculumSections
};

export default contentService;
