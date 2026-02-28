import { useState, useEffect } from "react";
import { db, ref, get } from "@/lib/firebase";
import { Student } from "@/types/exam";
import { exportToExcel } from "@/lib/excelUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Search, Loader2, Trophy, RefreshCw } from "lucide-react";

const AdminResults = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
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

  const maxPoints = questions.reduce((sum, q) => sum + (parseInt(q.points) || 0), 0);

  const merged = scores.map((sc) => {
    const stud = students.find((s) => s.student_id === sc.student_id);
    const totalPts = parseInt(sc.total_score) || 0;
    const pct = maxPoints > 0 ? Math.round((totalPts / maxPoints) * 100) : 0;
    return {
      ...sc,
      absen: stud?.absen || "-",
      nis: stud?.nis || "-",
      name: stud?.name || "-",
      class: stud?.class || "-",
      percentage: pct,
    };
  });

  const classes = [...new Set(students.map((s) => s.class))].sort();

  const filtered = merged
    .filter((m) => classFilter === "all" || m.class === classFilter)
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.nis.includes(search));

  const handleExport = () => {
    const data = filtered.map((m, i) => ({
      No: i + 1, Absen: m.absen, NIS: m.nis, Nama: m.name, Kelas: m.class,
      Skor: m.percentage, Waktu: m.duration, Status: m.status,
    }));
    exportToExcel(data, "Hasil_Ujian");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Trophy className="w-5 h-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground">Total Peserta</p><p className="text-xl font-bold">{merged.length}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><Trophy className="w-5 h-5 text-success" /></div>
            <div><p className="text-xs text-muted-foreground">Rata-rata Skor</p><p className="text-xl font-bold">{merged.length > 0 ? Math.round(merged.reduce((s, m) => s + m.percentage, 0) / merged.length) : 0}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center"><Trophy className="w-5 h-5 text-accent" /></div>
            <div><p className="text-xs text-muted-foreground">Memenuhi KKTP</p><p className="text-xl font-bold">{merged.filter((m) => m.status === "Memenuhi KKTP").length}</p></div>
          </CardContent>
        </Card>
      </div>

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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Absen</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead className="text-center">Skor</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m, i) => (
                <TableRow key={m.student_id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{m.absen}</TableCell>
                  <TableCell>{m.nis}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.class}</TableCell>
                  <TableCell className="text-center">{m.percentage}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.duration}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.status === "Memenuhi KKTP" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {m.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Tidak ada data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminResults;
