import api from './api';

export const getElabAttempts = async (exerciseId) => {
  const { data } = await api.get(`/api/codingexercise/${exerciseId}/attempts`);
  return data;
};

export const getElabAttemptDetails = async (attemptId) => {
  const { data } = await api.get(`/api/codingexercise/attempts/${attemptId}`);
  return data;
};

const elabAttemptService = {
  getElabAttempts,
  getElabAttemptDetails,
};

export default elabAttemptService;
