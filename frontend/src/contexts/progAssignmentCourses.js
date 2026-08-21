"use client";
import React, { createContext, useContext, useState } from 'react';

const ProgAssignmentContext = createContext();

export function useProgAssignment() {
  return useContext(ProgAssignmentContext);
}

export function ProgAssignmentProvider({ children }) {
  const [basicData, setBasicData] = useState({});
  const [questionData, setQuestionData] = useState({});

  return (
    <ProgAssignmentContext.Provider value={{ basicData, setBasicData, questionData, setQuestionData }}>
      {children}
    </ProgAssignmentContext.Provider>
  );
} 