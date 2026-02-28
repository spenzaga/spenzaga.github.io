import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useExam } from "@/context/ExamContext";
import { db, ref, get, set } from "@/lib/firebase";
import { Question } from "@/types/exam";
import { buildScoreRecord } from "@/lib/scoring";
import QuestionCard from "@/components/QuestionCard";
import NavigationPanel from "@/components/NavigationPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, Send, AlertTriangle, Clock, Loader2, CheckCircle2, HelpCircle, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Exam = () => {
  const { student } = useExam();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [violations, setViolations] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (!student) {
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        const blockedSnap = await get(ref(db, "config/exam_blocked"));
        if (blockedSnap.exists() && blockedSnap.val() === true) {
          setAlreadyTaken(true);
          setLoading(false);
          return;
        }
        const scoreSnap = await get(ref(db, `scores/${student.student_id}`));
        if (scoreSnap.exists()) {
          setAlreadyTaken(true);
          setLoading(false);
          return;
        }
        const qSnap = await get(ref(db, "questions"));
        if (qSnap.exists()) {
          setQuestions(qSnap.val());
        }
      } catch {
        toast({ title: "Error", description: "Gagal memuat soal", variant: "destructive" });
      }
      setLoading(false);
    };
    load();
  }, [student]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        setViolations((v) => {
          const next = v + 1;
          toast({
            title: `⚠️ Pelanggaran ${next}/5`,
            description: "Jangan berpindah tab! Jawaban akan otomatis terkirim setelah 5 pelanggaran.",
            variant: "destructive",
          });
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && ["p", "s", "c", "u"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        setViolations((v) => v + 1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!student || hasSubmitted.current) return;
    hasSubmitted.current = true;
    setSubmitting(true);

    const duration = formatTime(elapsed);
    const { record, totalPoints, maxPoints } = buildScoreRecord(student.student_id, questions, answers, duration);

    try {
      await set(ref(db, `scores/${student.student_id}`), record);
      navigate("/result", {
        state: { score: record, totalPoints, maxPoints, student },
      });
    } catch {
      toast({ title: "Error", description: "Gagal mengirim jawaban", variant: "destructive" });
      hasSubmitted.current = false;
      setSubmitting(false);
    }
  }, [student, questions, answers, elapsed, navigate]);

  useEffect(() => {
    if (violations >= 5 && !hasSubmitted.current) {
      toast({ title: "⛔ Auto Submit", description: "Jawaban otomatis terkirim karena pelanggaran.", variant: "destructive" });
      handleSubmit();
    }
  }, [violations, handleSubmit]);

  const toggleFlag = () => {
    const qid = questions[currentIndex]?.question_id;
    if (qid) setFlagged((prev) => ({ ...prev, [qid]: !prev[qid] }));
  };

  const getAnswerCounts = () => {
    let answered = 0;
    let unanswered = 0;
    questions.forEach((q) => {
      const a = answers[q.question_id];
      const isAnswered = a !== undefined && a !== "" && (Array.isArray(a) ? a.length > 0 : true);
      if (isAnswered) answered++;
      else unanswered++;
    });
    return { answered, unanswered };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (alreadyTaken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertTriangle className="w-16 h-16 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Ujian Sudah Dikerjakan</h2>
          <p className="text-muted-foreground mb-4">Anda hanya dapat mengerjakan ujian satu kali.</p>
          <Button onClick={() => navigate("/")}>Kembali</Button>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const answeredMap: Record<string, boolean> = {};
  questions.forEach((q) => {
    const a = answers[q.question_id];
    answeredMap[q.question_id] = a !== undefined && a !== "" && (Array.isArray(a) ? a.length > 0 : true);
  });

  const { answered: answeredCount, unanswered: unansweredCount } = getAnswerCounts();
  const isFlagged = flagged[currentQ.question_id] || false;

  const typeLabels: Record<string, string> = {
    TF: "Benar / Salah", MC: "Pilihan Ganda", MR: "Jawaban Ganda",
    TI: "Jawaban Singkat", MG: "Menjodohkan", SEQ: "Urutan", NUMG: "Numerik",
  };

  return (
    <div className="min-h-screen bg-background no-select">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">{formatTime(elapsed)}</span>
          </div>
          <h1 className="text-sm font-bold hidden sm:block">CBT SMP Negeri 1 Purbalingga</h1>
          <div className="flex items-center gap-2">
            {violations > 0 && (
              <span className="text-xs bg-destructive/80 px-2 py-0.5 rounded-full">
                ⚠️ {violations}/5
              </span>
            )}
            <span className="text-xs opacity-80">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            {/* Question number + type inline + flag button */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-bold text-primary">Soal {currentIndex + 1}</span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {typeLabels[currentQ.question_type] || currentQ.question_type}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">{currentQ.points} poin</span>
              <button
                onClick={toggleFlag}
                className={`ml-2 p-1.5 rounded-lg transition-colors ${isFlagged ? "bg-amber-100 text-amber-600" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"}`}
                title="Tandai soal untuk direview"
              >
                <Flag className="w-4 h-4" fill={isFlagged ? "currentColor" : "none"} />
              </button>
            </div>

            <QuestionCard
              question={currentQ}
              index={currentIndex}
              answer={answers[currentQ.question_id]}
              onChange={(val) => setAnswers((prev) => ({ ...prev, [currentQ.question_id]: val }))}
              hideHeader
            />
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={currentIndex === 0}
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Sebelumnya
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex((i) => i + 1)} className="gap-1">
              Selanjutnya <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={submitting}
              className="gap-1 bg-success hover:bg-success/90 text-success-foreground"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Kirim Jawaban
            </Button>
          )}
        </div>
      </div>

      <NavigationPanel
        total={questions.length}
        current={currentIndex}
        answered={answeredMap}
        flagged={flagged}
        questionIds={questions.map((q) => q.question_id)}
        onNavigate={setCurrentIndex}
      />

      {/* Submit confirmation dialog */}
      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="w-7 h-7 text-primary" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Kirim Jawaban?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Apakah Anda yakin akan mengirim jawaban? Setelah dikirim, jawaban tidak dapat diubah.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 my-2">
            <div className="flex-1 bg-success/10 rounded-lg p-3 text-center">
              <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold text-success">{answeredCount}</p>
              <p className="text-xs text-muted-foreground">Terjawab</p>
            </div>
            <div className="flex-1 bg-destructive/10 rounded-lg p-3 text-center">
              <HelpCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
              <p className="text-2xl font-bold text-destructive">{unansweredCount}</p>
              <p className="text-xs text-muted-foreground">Belum Dijawab</p>
            </div>
          </div>
          {unansweredCount > 0 && (
            <p className="text-xs text-center text-destructive font-medium">
              ⚠️ Masih ada {unansweredCount} soal yang belum dijawab!
            </p>
          )}
          <AlertDialogFooter className="flex-row justify-center gap-3 mt-2">
            <AlertDialogCancel className="flex-1 m-0">Kembali</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} className="flex-1 m-0 bg-success hover:bg-success/90 text-success-foreground">
              Ya, Kirim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Exam;
