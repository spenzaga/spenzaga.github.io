import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ScoreRecord, Student } from "@/types/exam";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, FileText, Download, LogOut } from "lucide-react";
import confetti from "canvas-confetti";
import { useExam } from "@/context/ExamContext";

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setStudent } = useExam();
  const [reviewUsed, setReviewUsed] = useState(false);
  const state = location.state as {
    score: ScoreRecord;
    totalPoints: number;
    maxPoints: number;
    student: Student;
  } | null;

  useEffect(() => {
    if (!state) {
      navigate("/");
      return;
    }
    const pct = (state.totalPoints / state.maxPoints) * 100;
    if (pct >= 80) {
      const end = Date.now() + 3000;
      const fire = () => {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 }, colors: ["#1a4480", "#d4a017", "#22c55e"] });
        if (Date.now() < end) requestAnimationFrame(fire);
      };
      fire();
    }

    // Auto redirect to login after 1 minute
    const timeout = setTimeout(() => {
      setStudent(null);
      sessionStorage.clear();
      navigate("/");
    }, 60000);

    return () => clearTimeout(timeout);
  }, [state]);

  if (!state) return null;

  const { score, totalPoints, maxPoints, student } = state;
  const pct = Math.round((totalPoints / maxPoints) * 100);

  const handleLogout = () => {
    setStudent(null);
    sessionStorage.clear();
    navigate("/");
  };

  const handleReview = () => {
    setReviewUsed(true);
    navigate("/review", { state });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 animate-fade-in">
        <CardContent className="p-8 text-center space-y-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${pct >= 80 ? "bg-success/10" : "bg-accent/10"}`}>
            <Trophy className={`w-10 h-10 ${pct >= 80 ? "text-success" : "text-accent"}`} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Hasil Ujian</h1>
            <p className="text-muted-foreground text-sm">{score.status}</p>
          </div>

          <div className="bg-secondary/50 rounded-2xl p-6">
            <div className="text-5xl font-extrabold text-primary mb-1">{pct}</div>
            <p className="text-sm text-muted-foreground">
              Skor: {totalPoints} / {maxPoints}
            </p>
          </div>

          <div className="bg-secondary/30 rounded-xl p-4 text-left space-y-2">
            {[
              { l: "Nama", v: student.name },
              { l: "NIS", v: student.nis },
              { l: "Kelas", v: student.class },
              { l: "Durasi", v: score.duration },
            ].map((r) => (
              <div key={r.l} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{r.l}</span>
                <span className="font-semibold">{r.v}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">Halaman ini akan otomatis kembali ke login dalam 1 menit.</p>

          <div className="flex flex-col gap-2">
            <Button onClick={handleReview} variant="outline" className="gap-2" disabled={reviewUsed}>
              <FileText className="w-4 h-4" /> {reviewUsed ? "Review Sudah Dilihat" : "Review Soal"}
            </Button>
            <Button onClick={() => navigate("/certificate", { state })} className="gap-2">
              <Download className="w-4 h-4" /> Download Sertifikat
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut className="w-4 h-4" /> Keluar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Result;
