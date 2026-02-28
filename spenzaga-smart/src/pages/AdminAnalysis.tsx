import { useState, useEffect } from "react";
import { db, ref, get } from "@/lib/firebase";
import { Question } from "@/types/exam";
import { exportToExcel } from "@/lib/excelUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Loader2 } from "lucide-react";

const AdminAnalysis = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [qSnap, sSnap] = await Promise.all([
          get(ref(db, "questions")),
          get(ref(db, "scores")),
        ]);
        if (qSnap.exists()) {
          const d = qSnap.val();
          setQuestions(Array.isArray(d) ? d : Object.values(d));
        }
        if (sSnap.exists()) {
          const d = sSnap.val();
          setScores(Array.isArray(d) ? d : Object.values(d));
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const totalStudents = scores.length;

  const analysis = questions.map((q) => {
    const answers = scores.map((sc) => {
      const ans = sc.answers?.find((a: any) => a.question_id === q.question_id);
      return ans;
    }).filter(Boolean);

    const correctCount = answers.filter((a: any) => a.correct).length;

    // Tingkat Kesukaran (Difficulty Index) = correct / total
    const difficulty = totalStudents > 0 ? correctCount / totalStudents : 0;
    let diffLabel = "Sedang";
    if (difficulty < 0.3) diffLabel = "Sukar";
    else if (difficulty > 0.7) diffLabel = "Mudah";

    // Daya Beda (Discrimination Index)
    // Sort students by total score, split upper/lower 27%
    const sortedScores = [...scores].sort((a, b) => parseInt(b.total_score) - parseInt(a.total_score));
    const groupSize = Math.max(1, Math.ceil(totalStudents * 0.27));
    const upperGroup = sortedScores.slice(0, groupSize);
    const lowerGroup = sortedScores.slice(-groupSize);

    const upperCorrect = upperGroup.filter((sc) => sc.answers?.find((a: any) => a.question_id === q.question_id)?.correct).length;
    const lowerCorrect = lowerGroup.filter((sc) => sc.answers?.find((a: any) => a.question_id === q.question_id)?.correct).length;
    const discrimination = groupSize > 0 ? (upperCorrect - lowerCorrect) / groupSize : 0;

    let discLabel = "Cukup";
    if (discrimination < 0.2) discLabel = "Jelek";
    else if (discrimination >= 0.4) discLabel = "Baik";

    // Efektivitas Pengecoh
    const opts = [q.answer_1, q.answer_2, q.answer_3, q.answer_4].filter(Boolean);
    const correctOpts = opts.filter((o) => o.startsWith("*")).map((o) => o.slice(1));
    const distractors = opts.filter((o) => !o.startsWith("*"));
    const distractorCounts = distractors.map((d) => {
      const count = answers.filter((a: any) => {
        const resp = Array.isArray(a.response) ? a.response : [a.response];
        return resp.includes(d);
      }).length;
      return { distractor: d, count, pct: totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0 };
    });
    const effectiveDistractors = distractorCounts.filter((d) => d.pct >= 5).length;
    const distractorEffectiveness = distractors.length > 0
      ? `${effectiveDistractors}/${distractors.length}`
      : "-";

    // Point Biserial (simplified validity)
    const totalScoresArr = scores.map((sc) => parseInt(sc.total_score) || 0);
    const meanTotal = totalScoresArr.reduce((s, v) => s + v, 0) / (totalStudents || 1);
    const sdTotal = Math.sqrt(totalScoresArr.reduce((s, v) => s + Math.pow(v - meanTotal, 2), 0) / (totalStudents || 1));

    const correctStudentScores = scores
      .filter((sc) => sc.answers?.find((a: any) => a.question_id === q.question_id)?.correct)
      .map((sc) => parseInt(sc.total_score) || 0);
    const meanCorrect = correctStudentScores.length > 0
      ? correctStudentScores.reduce((s, v) => s + v, 0) / correctStudentScores.length : 0;

    const p = difficulty;
    const validity = sdTotal > 0 && p > 0 && p < 1
      ? ((meanCorrect - meanTotal) / sdTotal) * Math.sqrt(p / (1 - p))
      : 0;

    let validLabel = "Rendah";
    if (Math.abs(validity) >= 0.4) validLabel = "Tinggi";
    else if (Math.abs(validity) >= 0.2) validLabel = "Sedang";

    return {
      id: q.question_id,
      text: q.question_text,
      type: q.question_type,
      difficulty: Math.round(difficulty * 100) / 100,
      diffLabel,
      discrimination: Math.round(discrimination * 100) / 100,
      discLabel,
      distractorEffectiveness,
      validity: Math.round(validity * 100) / 100,
      validLabel,
    };
  });

  // KR-20 Reliability
  const kr20 = (() => {
    if (totalStudents < 2 || questions.length < 2) return 0;
    const totalScoresArr = scores.map((sc) => parseInt(sc.total_score) || 0);
    const meanTotal = totalScoresArr.reduce((s, v) => s + v, 0) / totalStudents;
    const variance = totalScoresArr.reduce((s, v) => s + Math.pow(v - meanTotal, 2), 0) / totalStudents;
    if (variance === 0) return 0;

    const sumPQ = analysis.reduce((s, a) => {
      const p = a.difficulty;
      return s + p * (1 - p);
    }, 0);

    const k = questions.length;
    return (k / (k - 1)) * (1 - sumPQ / (variance / (parseInt(questions[0]?.points || "10") ** 2 || 1)));
  })();

  const handleExport = () => {
    const data = analysis.map((a, i) => ({
      No: i + 1, ID: a.id, Soal: a.text,
      Tingkat_Kesukaran: a.difficulty, Kategori_TK: a.diffLabel,
      Daya_Beda: a.discrimination, Kategori_DB: a.discLabel,
      Efektivitas_Pengecoh: a.distractorEffectiveness,
      Validitas: a.validity, Kategori_V: a.validLabel,
    }));
    data.push({ No: 0, ID: "", Soal: "Reliabilitas (KR-20)", Tingkat_Kesukaran: Math.round(kr20 * 100) / 100 } as any);
    exportToExcel(data, "Analisis_Soal");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Reliabilitas (KR-20)</p>
              <p className="text-2xl font-bold">{Math.round(kr20 * 100) / 100}</p>
              <p className="text-xs text-muted-foreground">{kr20 >= 0.7 ? "Reliabel" : kr20 >= 0.4 ? "Cukup Reliabel" : "Kurang Reliabel"}</p>
            </CardContent>
          </Card>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5"><Download className="w-4 h-4" />Ekspor</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Soal</TableHead>
                <TableHead className="text-center">TK</TableHead>
                <TableHead className="text-center">Kategori</TableHead>
                <TableHead className="text-center">DB</TableHead>
                <TableHead className="text-center">Kategori</TableHead>
                <TableHead className="text-center">Pengecoh</TableHead>
                <TableHead className="text-center">Validitas</TableHead>
                <TableHead className="text-center">Kategori</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.map((a, i) => (
                <TableRow key={a.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{a.id}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">{a.text}</TableCell>
                  <TableCell className="text-center font-mono">{a.difficulty}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.diffLabel === "Mudah" ? "bg-success/10 text-success" :
                      a.diffLabel === "Sukar" ? "bg-destructive/10 text-destructive" :
                      "bg-accent/10 text-accent"
                    }`}>{a.diffLabel}</span>
                  </TableCell>
                  <TableCell className="text-center font-mono">{a.discrimination}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.discLabel === "Baik" ? "bg-success/10 text-success" :
                      a.discLabel === "Jelek" ? "bg-destructive/10 text-destructive" :
                      "bg-accent/10 text-accent"
                    }`}>{a.discLabel}</span>
                  </TableCell>
                  <TableCell className="text-center text-sm">{a.distractorEffectiveness}</TableCell>
                  <TableCell className="text-center font-mono">{a.validity}</TableCell>
                  <TableCell className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.validLabel === "Tinggi" ? "bg-success/10 text-success" :
                      a.validLabel === "Rendah" ? "bg-destructive/10 text-destructive" :
                      "bg-accent/10 text-accent"
                    }`}>{a.validLabel}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalysis;
