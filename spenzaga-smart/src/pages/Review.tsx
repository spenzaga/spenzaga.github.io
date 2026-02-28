import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, ref, get } from "@/lib/firebase";
import { Question, ScoreRecord, Student } from "@/types/exam";
import { useExam } from "@/context/ExamContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";

const clean = (s: string) => s.replace(/^\*/, "");

const Review = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setStudent } = useExam();
  const state = location.state as { score: ScoreRecord; student: Student } | null;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!state) { navigate("/"); return; }
    Promise.all([
      get(ref(db, "questions")),
      get(ref(db, "config/review_duration")),
    ]).then(([qSnap, durSnap]) => {
      if (qSnap.exists()) setQuestions(qSnap.val());
      const dur = durSnap.exists() ? durSnap.val() : 60;
      setTimeLeft(dur);
    });
  }, [state]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(interval);
          setStudent(null);
          sessionStorage.clear();
          navigate("/");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft !== null]);

  if (!state || !questions.length) return null;
  const { score } = state;

  const typeLabels: Record<string, string> = {
    TF: "Benar / Salah", MC: "Pilihan Ganda", MR: "Jawaban Ganda",
    TI: "Jawaban Singkat", MG: "Menjodohkan", SEQ: "Urutan", NUMG: "Numerik",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStudent(null); sessionStorage.clear(); navigate("/"); }} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-sm font-bold">Review Soal</h1>
          {timeLeft !== null && (
            <div className="ml-auto flex items-center gap-1.5 bg-primary-foreground/10 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-mono font-bold">{timeLeft}s</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {questions.map((q, i) => {
          const ans = score.answers.find((a) => a.question_id === q.question_id);
          const isCorrect = ans?.correct || false;
          const response = ans?.response || "-";
          const opts = [q.answer_1, q.answer_2, q.answer_3, q.answer_4].filter(Boolean);
          const correctAnswers = opts.filter((o) => o.startsWith("*")).map((o) => o.slice(1));

          const formatResponse = (r: string | string[]) => (Array.isArray(r) ? r.join(", ") : r);

          let correctDisplay = "";
          if (["TF", "MC", "TI", "NUMG"].includes(q.question_type)) correctDisplay = correctAnswers.join(" / ");
          else if (q.question_type === "MR") correctDisplay = correctAnswers.join(", ");
          else if (q.question_type === "MG") correctDisplay = opts.join(", ");
          else if (q.question_type === "SEQ") correctDisplay = opts.join(" → ");

          return (
            <Card key={q.question_id} className={`border-l-4 ${isCorrect ? "border-l-success" : "border-l-destructive"}`}>
              <CardContent className="p-5">
                {/* Header: number, type, status */}
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Soal {i + 1}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {typeLabels[q.question_type] || q.question_type}
                      </span>
                    </div>

                    {/* Media */}
                    {q.image && <img src={q.image} alt="Soal" className="max-w-full max-h-48 rounded-lg mb-2" />}
                    {q.video && (
                      <video controls className="max-w-full max-h-48 rounded-lg mb-2">
                        <source src={q.video} type="video/mp4" />
                      </video>
                    )}
                    {q.audio && (
                      <audio controls className="w-full mb-2">
                        <source src={q.audio} type="audio/mpeg" />
                      </audio>
                    )}

                    {/* Paragraph */}
                    {q.question_paragraph && (
                      <div className="bg-secondary/50 rounded-lg p-3 mb-2 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: q.question_paragraph }} />
                    )}

                    {/* Question text */}
                    <p className="font-medium text-foreground mb-3">{q.question_text}</p>

                    {/* Options display */}
                    {["TF", "MC", "MR"].includes(q.question_type) && (
                      <div className="space-y-1.5 mb-3">
                        {(q.question_type === "TF" ? ["True", "False"] : opts.map(clean)).map((opt, oi) => {
                          const isSelected = Array.isArray(response) ? response.includes(opt) : response === opt;
                          const isCorrectOpt = correctAnswers.includes(opt);
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                                isSelected && isCorrectOpt
                                  ? "border-success bg-success/10 text-success"
                                  : isSelected && !isCorrectOpt
                                  ? "border-destructive bg-destructive/10 text-destructive"
                                  : isCorrectOpt && !isCorrect
                                  ? "border-success/50 bg-success/5 text-success"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {isSelected ? (isCorrectOpt ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />) : (
                                <span className="w-4 h-4 rounded-full border border-current shrink-0" />
                              )}
                              <span>{opt}</span>
                              {isSelected && <span className="ml-auto text-xs opacity-70">(Jawaban Anda)</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* For non-choice types, show answer info */}
                {!["TF", "MC", "MR"].includes(q.question_type) && (
                  <div className="ml-8 space-y-1.5 text-sm">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground min-w-[100px]">Jawaban Anda:</span>
                      <span className={isCorrect ? "text-success font-medium" : "text-destructive font-medium"}>
                        {formatResponse(response)}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground min-w-[100px]">Jawaban Benar:</span>
                        <span className="text-success font-medium">{correctDisplay}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback */}
                <p className="ml-8 text-xs text-muted-foreground italic mt-2">
                  {isCorrect ? q.correct_feedback : q.incorrect_feedback}
                </p>
              </CardContent>
            </Card>
          );
        })}

        <div className="text-center pt-4 pb-8">
          <Button onClick={() => { setStudent(null); sessionStorage.clear(); navigate("/"); }} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Review;
