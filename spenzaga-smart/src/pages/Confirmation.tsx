import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useExam } from "@/context/ExamContext";
import { db, ref, get } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { User, BookOpen, ArrowRight, AlertTriangle } from "lucide-react";

const Confirmation = () => {
  const { student } = useExam();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingScore, setExistingScore] = useState<number | null>(null);

  useEffect(() => {
    if (!student) {
      navigate("/");
      return;
    }
    const checkStatus = async () => {
      try {
        const [blockedSnap, scoreSnap] = await Promise.all([
          get(ref(db, "config/exam_blocked")),
          get(ref(db, `scores/${student.student_id}`)),
        ]);
        if ((blockedSnap.exists() && blockedSnap.val() === true) || scoreSnap.exists()) {
          setAlreadyTaken(true);
          if (scoreSnap.exists()) {
            const data = scoreSnap.val();
            const totalScore = parseFloat(data.total_score);
            setExistingScore(isNaN(totalScore) ? null : Math.round(totalScore));
          }
        }
      } catch {}
      setChecking(false);
    };
    checkStatus();
  }, [student]);

  if (!student) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 animate-fade-in">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-normal text-primary">Konfirmasi Data</h1>
          <p className="text-muted-foreground text-sm font-normal">
            Periksa data Anda sebelum memulai ujian
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          {/* Already taken notice */}
          {!checking && alreadyTaken && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-normal text-sm text-foreground">Ujian Sudah Dikerjakan</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-normal">Anda sudah mengerjakan ujian atau ujian sedang diblokir.</p>
              </div>
            </div>
          )}

          {/* Info - show name + score for already taken, full info otherwise */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            {alreadyTaken ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground font-normal">Nama</span>
                  <span className="font-normal text-foreground">{student.name}</span>
                </div>
                {existingScore !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-normal">Skor</span>
                    <span className="font-normal text-foreground">{existingScore}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                {[
                  { label: "No. Absen", value: student.absen },
                  { label: "NIS", value: student.nis },
                  { label: "Nama", value: student.name },
                  { label: "Kelas", value: student.class },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-normal">{item.label}</span>
                    <span className="font-normal text-foreground">{item.value}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {!alreadyTaken && (
            <>
              <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed font-normal">
                    Saya menyatakan bahwa saya akan mengerjakan ujian ini dengan
                    <strong> jujur</strong>, <strong>mandiri</strong>, dan tidak akan
                    menyalin jawaban dari sumber manapun.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(c) => setAgreed(c === true)}
                />
                <label htmlFor="agree" className="text-sm cursor-pointer text-foreground font-normal">
                  Saya menyetujui pernyataan kejujuran di atas
                </label>
              </div>

              <Button
                className="w-full h-12 text-base font-normal gap-2"
                disabled={!agreed || checking}
                onClick={() => navigate("/exam")}
              >
                Mulai Ujian
                <ArrowRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {alreadyTaken && (
            <Button variant="outline" className="w-full font-normal" onClick={() => navigate("/")}>
              Kembali ke Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Confirmation;
