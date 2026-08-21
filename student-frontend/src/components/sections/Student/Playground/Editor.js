"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { Moon, Sun, PlayCircle, RotateCcw } from "lucide-react";

const languages = [
  { id: 75, name: "C (Clang)", defaultCode: `#include <stdio.h>\nint main() {\n  printf("Hello, World!");\n  return 0;\n}` },
  { id: 105, name: "C++ (GCC)", defaultCode: `#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello, World!";\n  return 0;\n}` },
  { id: 62, name: "Java", defaultCode: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}` },
  { id: 102, name: "JavaScript", defaultCode: `console.log("Hello, World!");` },
  { id: 71, name: "Python", defaultCode: `print("Hello, World!")` },
];

const CodeEditor = () => {
  const [language, setLanguage] = useState(languages[4]); // default Python
  const [code, setCode] = useState(language.defaultCode);
  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [theme, setTheme] = useState("vs-dark");
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = (e) => {
    const selectedLang = languages.find((lang) => lang.id === parseInt(e.target.value));
    setLanguage(selectedLang);
    setCode(selectedLang.defaultCode);
  };

  const handleRun = async () => {
    setLoading(true);
    setOutput("");
    // console.log("Running code with api " + process.env.NEXT_PUBLIC_RAPIDAPI_KEY);

    try {
      const { data } = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions",
        {
          source_code: code,
          language_id: language.id,
          stdin: stdin,
          base64_encoded: false,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const token = data.token;

      const fetchResult = async () => {
        const res = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": process.env.NEXT_PUBLIC_RAPIDAPI_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        if (res.data.status.id <= 2) {
          setTimeout(fetchResult, 1000); 
        } else {
          setOutput(
            res.data.stdout || res.data.stderr || res.data.compile_output || "No output"
          );
          setLoading(false);
        }
      };

      fetchResult();
    } catch (err) {
      console.error(err);
      setOutput("Error while executing code");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCode(language.defaultCode);
    setStdin("");
    setOutput("");
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));
  };

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-4 items-center">
          <select
            className="p-2 border rounded"
            value={language.id}
            onChange={handleLanguageChange}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
          <button
            onClick={toggleTheme}
            className="p-2 rounded bg-gray-200 dark:bg-gray-700"
            title="Toggle Theme"
          >
            {theme === "vs-dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={loading}
            className="bg-green text-white px-3 py-1 rounded flex items-center gap-1"
          >
            <PlayCircle size={18} /> Run
          </button>
          <button
            onClick={handleReset}
            className="bg-red-500 text-white px-3 py-1 rounded flex items-center gap-1"
          >
            <RotateCcw size={18} /> Reset
          </button>
        </div>
      </div>

      <Editor
        height="450px"
        language={language.name.toLowerCase().includes("python") ? "python" : language.name.toLowerCase().includes("java") ? "java" : language.name.toLowerCase().includes("c++") ? "cpp" : language.name.toLowerCase().includes("c") ? "c" : "javascript"}
        value={code}
        onChange={(value) => setCode(value)}
        theme={theme}
      />

      <div className="mt-4">
        <label className="block font-medium mb-1">Custom Input (stdin):</label>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label className="block font-medium mb-1">Output:</label>
        <pre className="w-full bg-gray-100 p-3 rounded min-h-[100px] overflow-x-auto">
          {loading ? "Running..." : output}
        </pre>
      </div>
    </div>
  );
};

export default CodeEditor;
