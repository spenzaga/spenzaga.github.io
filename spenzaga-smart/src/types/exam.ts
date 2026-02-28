export interface Question {
  question_id: string;
  question_type: "TF" | "MC" | "MR" | "TI" | "MG" | "SEQ" | "NUMG";
  image: string;
  video: string;
  audio: string;
  question_paragraph: string;
  question_text: string;
  answer_1: string;
  answer_2: string;
  answer_3: string;
  answer_4: string;
  correct_feedback: string;
  incorrect_feedback: string;
  points: string;
}

export interface Student {
  student_id: string;
  absen: string;
  nis: string;
  name: string;
  class: string;
}

export interface AnswerRecord {
  question_id: string;
  response: string | string[];
  correct: boolean;
  points: string;
}

export interface ScoreRecord {
  student_id: string;
  answers: AnswerRecord[];
  total_score: string;
  duration: string;
  status: string;
}
