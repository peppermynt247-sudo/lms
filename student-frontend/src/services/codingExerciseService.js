import api from './api';

export const getCodingExerciseById = async (id) => {
  const { data } = await api.get(`/api/codingexercise/${id}`);
  return data;
};

export const runCodingExercise = async ({ sourceCode, languageId, codingExerciseId }) => {
  console.log("source code:" + sourceCode + " language:" + languageId +" codingExerciseId:" +codingExerciseId)
  const { data } = await api.post('/api/codingexercise/run', {
    sourceCode,
    languageId,
    codingExerciseId,
  });
  return data;
};

export const submitCodingExercise = async ({ sourceCode, languageId, codingExerciseId }) => {
  const { data } = await api.post('/api/codingexercise/submit', {
    sourceCode,
    languageId,
    codingExerciseId,
  });
  return data;
};

const codingExerciseService = {
  getCodingExerciseById,
  runCodingExercise,
  submitCodingExercise,
};

export default codingExerciseService;


