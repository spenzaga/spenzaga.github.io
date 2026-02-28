import { useState, useEffect } from "react";
import { db, ref, get } from "@/lib/firebase";
import { Student, Question } from "@/types/exam";
import { exportToExcel } from "@/lib/excelUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Download, Loader2, Users, TrendingUp, Award, Target } from "lucide-react";

const COLORS = [
  "hsl(215, 70%, 25%)", "hsl(142, 71%, 35%)", "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)", "hsl(215, 60%, 50%)", "hsl(142, 60%, 40%)",
];

const AdminStatistics = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [studSnap, scoreSnap, qSnap] = await Promise.all([
          get(ref(db, "students")),
          get(ref(db, "scores")),
          get(ref(db, "questions")),
        ]);
        if (studSnap.exists()) { const d = studSnap.val(); setStudents(Array.isArray(d) ? d : Object.values(d)); }
        if (scoreSnap.exists()) { const d = scoreSnap.val(); setScores(Array.isArray(d) ? d : Object.values(d)); }
        if (qSnap.exists()) { const d = qSnap.val(); setQuestions(Array.isArray(d) ? d : Object.values(d)); }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const maxPoints = questions.reduce((s, q) => s + (parseInt(q.points) || 0), 0);
  const percentages = scores.map((sc) => {
    const pts = parseInt(sc.total_score) || 0;
    return maxPoints > 0 ? Math.round((pts / maxPoints) * 100) : 0;
  });

  const avg = percentages.length > 0 ? Math.round(percentages.reduce((s, v) => s + v, 0) / percentages.length) : 0;
  const highest = percentages.length > 0 ? Math.max(...percentages) : 0;
  const lowest = percentages.length > 0 ? Math.min(...percentages) : 0;
  const passing = percentages.filter((p) => p >= 75).length;

  // Score distribution
  const distribution = [
    { range: "0-20", count: percentages.filter((p) => p <= 20).length },
    { range: "21-40", count: percentages.filter((p) => p > 20 && p <= 40).length },
    { range: "41-60", count: percentages.filter((p) => p > 40 && p <= 60).length },
    { range: "61-80", count: percentages.filter((p) => p > 60 && p <= 80).length },
    { range: "81-100", count: percentages.filter((p) => p > 80).length },
  ];

  // Per class stats
  const classes = [...new Set(students.map((s) => s.class))].sort();
  const classStats = classes.map((cls) => {
    const classStudents = students.filter((s) => s.class === cls);
    const classScores = classStudents.map((st) => {
      const sc = scores.find((s) => s.student_id === st.student_id);
      if (!sc) return null;
      const pts = parseInt(sc.total_score) || 0;
      return maxPoints > 0 ? Math.round((pts / maxPoints) * 100) : 0;
    }).filter((v): v is number => v !== null);
    const classAvg = classScores.length > 0 ? Math.round(classScores.reduce((s, v) => s + v, 0) / classScores.length) : 0;
    return { class: cls, total: classStudents.length, done: classScores.length, avg: classAvg };
  });

  // Status pie
  const statusData = [
    { name: "Memenuhi KKTP", value: passing },
    { name: "Belum Memenuhi", value: percentages.length - passing },
  ];

  const chartConfig = {
    count: { label: "Jumlah", color: "hsl(215, 70%, 25%)" },
  };

  const handleExport = () => {
    const sheets: any[] = [];
    sheets.push(...distribution.map((d) => ({ Rentang: d.range, Jumlah: d.count })));
    exportToExcel(
      [
        { Statistik: "Rata-rata", Nilai: `${avg}%` },
        { Statistik: "Tertinggi", Nilai: `${highest}%` },
        { Statistik: "Terendah", Nilai: `${lowest}%` },
        { Statistik: "Memenuhi KKTP", Nilai: passing },
        { Statistik: "Belum Memenuhi", Nilai: percentages.length - passing },
        {},
        ...distribution.map((d) => ({ Statistik: d.range, Nilai: d.count })),
        {},
        ...classStats.map((c) => ({
          Statistik: `Kelas ${c.class}`, Nilai: `${c.avg}% (${c.done}/${c.total} peserta)`,
        })),
      ],
      "Statistik_Ujian"
    );
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Rata-rata", value: `${avg}`, icon: TrendingUp, color: "text-primary" },
          { label: "Tertinggi", value: `${highest}`, icon: Award, color: "text-success" },
          { label: "Terendah", value: `${lowest}`, icon: Target, color: "text-destructive" },
          { label: "Peserta", value: `${scores.length}/${students.length}`, icon: Users, color: "text-accent" },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-secondary flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
          <Download className="w-4 h-4" />Ekspor
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Distribusi Nilai</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="range" className="text-xs" />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(215, 70%, 25%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">Status Kelulusan</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class stats table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Statistik Per Kelas</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kelas</TableHead>
                <TableHead className="text-center">Total Siswa</TableHead>
                <TableHead className="text-center">Sudah Mengerjakan</TableHead>
                <TableHead className="text-center">Rata-rata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classStats.map((c) => (
                <TableRow key={c.class}>
                  <TableCell className="font-medium">{c.class}</TableCell>
                  <TableCell className="text-center">{c.total}</TableCell>
                  <TableCell className="text-center">{c.done}</TableCell>
                  <TableCell className="text-center font-bold">{c.avg}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatistics;
