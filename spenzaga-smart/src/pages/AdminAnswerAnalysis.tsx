import { useState, useEffect } from "react";
import { db, ref, get } from "@/lib/firebase";
import { Student, Question } from "@/types/exam";
import { exportToExcel } from "@/lib/excelUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Search, Loader2, RefreshCw } from "lucide-react";

const AdminAnswerAnalysis = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studSnap, scoreSnap, qSnap] = await Promise.all([
        get(ref(db, "students")),
        get(ref(db, "scores")),
        get(ref(db, "questions")),
      ]);
      if (studSnap.exists()) {
        const d = studSnap.val();
        setStudents(Array.isArray(d) ? d : Object.values(d));
      }
      if (scoreSnap.exists()) {
        const d = scoreSnap.val();
        setScores(Array.isArray(d) ? d : Object.values(d));
      }
      if (qSnap.exists()) {
        const d = qSnap.val();
        setQuestions(Array.isArray(d) ? d : Object.values(d));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const classes = [...new Set(students.map((s) => s.class))].sort();

  // Build analysis data
  const analysisData = scores.map((sc) => {
    const stud = students.find((s) => s.student_id === sc.student_id);
    if (!stud) return null;
    const answerMap: Record<string, boolean> = {};
    if (sc.answers && Array.isArray(sc.answers)) {
      sc.answers.forEach((a: any) => {
        answerMap[a.question_id] = a.correct === true;
      });
    }
    return {
      student_id: sc.student_id,
      nis: stud.nis,
      name: stud.name,
      class: stud.class,
      answers: answerMap,
    };
  }).filter(Boolean) as { student_id: string; nis: string; name: string; class: string; answers: Record<string, boolean> }[];

  const filtered = analysisData
    .filter((m) => classFilter === "all" || m.class === classFilter)
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.nis.includes(search));

  const handleExport = () => {
    const data = filtered.map((m, i) => {
      const row: any = { No: i + 1, NIS: m.nis, Nama: m.name, Kelas: m.class };
      questions.forEach((q, qi) => {
        row[`Soal ${qi + 1}`] = m.answers[q.question_id] === true ? "1" : m.answers[q.question_id] === false ? "-" : "";
      });
      return row;
    });
    exportToExcel(data, "Analisis_Jawaban");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {classes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchData} className="gap-1.5"><RefreshCw className="w-4 h-4" />Refresh</Button>
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5"><Download className="w-4 h-4" />Ekspor</Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Analisis Jawaban Peserta — <span className="text-muted-foreground font-normal text-sm">"1" = Benar, "-" = Salah</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 sticky left-0 bg-card z-10">No</TableHead>
                <TableHead className="sticky left-10 bg-card z-10">NIS</TableHead>
                <TableHead className="sticky left-24 bg-card z-10">Nama</TableHead>
                <TableHead>Kelas</TableHead>
                {questions.map((_, qi) => (
                  <TableHead key={qi} className="text-center min-w-[40px] px-1">{qi + 1}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m, i) => (
                <TableRow key={m.student_id}>
                  <TableCell className="sticky left-0 bg-card z-10">{i + 1}</TableCell>
                  <TableCell className="sticky left-10 bg-card z-10 text-xs">{m.nis}</TableCell>
                  <TableCell className="sticky left-24 bg-card z-10 font-medium text-sm">{m.name}</TableCell>
                  <TableCell>{m.class}</TableCell>
                  {questions.map((q) => {
                    const val = m.answers[q.question_id];
                    return (
                      <TableCell key={q.question_id} className="text-center px-1">
                        {val === true ? (
                          <span className="text-success font-bold">1</span>
                        ) : val === false ? (
                          <span className="text-destructive font-bold">-</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4 + questions.length} className="text-center text-muted-foreground py-8">Tidak ada data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnswerAnalysis;
