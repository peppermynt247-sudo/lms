// Shared parser for Edmingle-format Word documents.
// Format reference:
//   [Type] 0          → 0=MCQ, 1=MULTIPLE_CORRECT, 6=TRUE_FALSE
//   [Marks] 1
//   [Negative Marks] 0
//   [Topic] Bank Name
//   [Difficulty] Beginner | Intermediate | Advanced
//   Q.1)Question text
//   [a]Option / *[b]Correct option
//   [s1]Explanation

export const DIFFICULTY_MAP = {
  beginner: "EASY",
  intermediate: "MEDIUM",
  advanced: "HARD",
};

export const TYPE_MAP = {
  0: "MCQ",
  1: "MULTIPLE_CORRECT",
  6: "TRUE_FALSE",
};

export const parseDocxHeader = (text) => {
  const headerTypeMatch = text.match(/\[Type\]\s*(\d+)/i);
  const marksMatch = text.match(/\[Marks\]\s*([\d.]+)/i);
  const negMarksMatch = text.match(/\[Negative Marks\]\s*([\d.]+)/i);
  const difficultyMatch = text.match(/\[Difficulty\]\s*(\w+)/i);
  const topicMatch = text.match(/\[Topic\]\s*(.+)/i);

  const typeCode = headerTypeMatch ? parseInt(headerTypeMatch[1]) : null;

  return {
    topicName: topicMatch ? topicMatch[1].trim() : null,
    questionsType: typeCode !== null ? TYPE_MAP[typeCode] || "MCQ" : null,
    points: marksMatch ? parseInt(marksMatch[1], 10) || 1 : 1,
    negativeMark: negMarksMatch ? parseFloat(negMarksMatch[1]) || 0 : 0,
    difficultyLevel: difficultyMatch
      ? DIFFICULTY_MAP[difficultyMatch[1].toLowerCase()] || "EASY"
      : "EASY",
  };
};

export const parseQuestionsFromText = (text) => {
  try {
    const {
      points: docPoints,
      negativeMark: docNegativeMark,
      difficultyLevel: docDifficulty,
      questionsType: docTypeHint,
    } = parseDocxHeader(text);

    const blocks = text
      .split(/(?=Q\.\d+\))/g)
      .filter((b) => b.trim().startsWith("Q."));

    return blocks
      .map((block) => {
        const blockNoHint = block.replace(/\[hint\][^\n]*/gi, "").trim();

        const solutionPos = blockNoHint.search(/\[s\d+\]/i);
        const explanation =
          solutionPos !== -1
            ? blockNoHint.slice(solutionPos).replace(/\[s\d+\]\s*/i, "").trim()
            : "";
        const blockClean =
          solutionPos !== -1
            ? blockNoHint.slice(0, solutionPos).trim()
            : blockNoHint;

        const qMatch = blockClean.match(
          /^Q\.\d+\)\s*([\s\S]*?)(?=\*?\[[a-d]\]|\[answer\]|$)/i
        );
        if (!qMatch) return null;

        const questionText = qMatch[1]?.trim() || "";
        if (!questionText) return null;

        // ONE_WORD: [answer] tag
        const answerMatch = blockClean.match(/\[answer\]\s*(.*)/i);
        if (answerMatch) {
          return {
            questionType: "ONE_WORD",
            questionText,
            explanation,
            points: docPoints,
            difficultyLevel: docDifficulty,
            negativeMark: docNegativeMark,
            mediaUrl: null,
            correctAnswer: answerMatch[1]?.trim() || "",
            options: [],
          };
        }

        const optionMatches = [
          ...blockClean.matchAll(
            /(\*?)\[(a|b|c|d)\]\s*([\s\S]*?)(?=\*?\[[a-d]\]|$)/gi
          ),
        ];

        const options = optionMatches.map((match, idx) => ({
          optionText: match[3]?.trim() || "",
          isCorrect: match[1] === "*",
          explanation: "",
          optionOrder: idx + 1,
        }));

        if (options.length === 0) return null;

        const correctCount = options.filter((o) => o.isCorrect).length;
        const isTrueFalse =
          options.length === 2 &&
          options.every((o) =>
            ["true", "false"].includes(o.optionText.toLowerCase())
          );
        const questionType = isTrueFalse
          ? "TRUE_FALSE"
          : correctCount > 1
          ? "MULTIPLE_CORRECT"
          : docTypeHint || "MCQ";

        return {
          questionType,
          questionText,
          explanation,
          points: docPoints,
          difficultyLevel: docDifficulty,
          negativeMark: docNegativeMark,
          mediaUrl: null,
          options,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};
