import { createContext, useContext, useState, ReactNode } from "react";
import { Student } from "@/types/exam";

interface ExamContextType {
  student: Student | null;
  setStudent: (student: Student | null) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudentState] = useState<Student | null>(() => {
    try {
      const saved = sessionStorage.getItem("cbt_student");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setStudent = (s: Student | null) => {
    setStudentState(s);
    if (s) sessionStorage.setItem("cbt_student", JSON.stringify(s));
    else sessionStorage.removeItem("cbt_student");
  };

  return (
    <ExamContext.Provider value={{ student, setStudent }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error("useExam must be within ExamProvider");
  return ctx;
};
