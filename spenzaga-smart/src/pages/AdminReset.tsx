import { useState, useEffect } from "react";
import { db, ref, get, set } from "@/lib/firebase";
import { Student } from "@/types/exam";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RotateCcw, Lock, Unlock, Loader2, CheckCircle2, Clock, AlertTriangle, Search, Eye, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminReset = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [examBlocked, setExamBlocked] = useState(false);
  const [reviewDuration, setReviewDuration] = useState(60);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmResetAll, setConfirmResetAll] = useState(false);
  const [confirmResetStudent, setConfirmResetStudent] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studSnap, scoreSnap, configSnap, reviewSnap] = await Promise.all([
        get(ref(db, "students")),
        get(ref(db, "scores")),
        get(ref(db, "config/exam_blocked")),
        get(ref(db, "config/review_duration")),
      ]);
      if (studSnap.exists()) { const d = studSnap.val(); setStudents(Array.isArray(d) ? d : Object.values(d)); }
      if (scoreSnap.exists()) { const d = scoreSnap.val(); setScores(Array.isArray(d) ? d : Object.values(d)); }
      if (configSnap.exists()) setExamBlocked(configSnap.val());
      if (reviewSnap.exists()) setReviewDuration(reviewSnap.val());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const scoreMap = new Map(scores.map((s) => [s.student_id, s]));

  const resetStudent = async (studentId: string) => {
    const updated = scores.filter((s) => s.student_id !== studentId);
    await set(ref(db, "scores"), updated.length > 0 ? updated : null);
    setScores(updated);
    setConfirmResetStudent(null);
    toast({ title: "Berhasil", description: "Hasil ujian siswa telah direset" });
  };

  const resetAll = async () => {
    await set(ref(db, "scores"), null);
    setScores([]);
    setConfirmResetAll(false);
    toast({ title: "Berhasil", description: "Semua hasil ujian telah direset" });
  };

  const toggleBlock = async (blocked: boolean) => {
    await set(ref(db, "config/exam_blocked"), blocked);
    setExamBlocked(blocked);
    toast({
      title: blocked ? "Ujian Diblokir" : "Ujian Dibuka",
      description: blocked ? "Siswa tidak dapat mengakses ujian" : "Siswa dapat mengakses ujian",
    });
  };

  const filteredStudents = students.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search) || s.class.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const resetStudentName = confirmResetStudent ? students.find(s => s.student_id === confirmResetStudent)?.name : "";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Access control */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {examBlocked ? <Lock className="w-4 h-4 text-destructive" /> : <Unlock className="w-4 h-4 text-success" />}
            Kontrol Akses Ujian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Status Ujian</p>
              <p className="text-xs text-muted-foreground">
                {examBlocked ? "Ujian diblokir — siswa tidak dapat mengakses" : "Ujian terbuka — siswa dapat mengerjakan"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${examBlocked ? "text-destructive" : "text-success"}`}>
                {examBlocked ? "Diblokir" : "Terbuka"}
              </span>
              <Switch checked={!examBlocked} onCheckedChange={(checked) => toggleBlock(!checked)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Duration Setting */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            Durasi Review Soal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Waktu Review</p>
              <p className="text-xs text-muted-foreground">
                Durasi siswa dapat melihat halaman review soal setelah ujian (dalam detik)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={10}
                max={600}
                value={reviewDuration}
                onChange={(e) => setReviewDuration(Number(e.target.value))}
                className="w-20 h-9 text-center"
              />
              <span className="text-sm text-muted-foreground">detik</span>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  await set(ref(db, "config/review_duration"), reviewDuration);
                  toast({ title: "Berhasil", description: `Durasi review diatur ke ${reviewDuration} detik` });
                }}
              >
                <Save className="w-3.5 h-3.5" /> Simpan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset all */}
      <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-medium text-sm">Reset Semua Hasil Ujian</p>
              <p className="text-xs text-muted-foreground">Menghapus semua data skor. Tidak dapat dibatalkan.</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={() => setConfirmResetAll(true)} className="gap-1.5">
            <RotateCcw className="w-4 h-4" />Reset Semua
          </Button>
        </CardContent>
      </Card>

      {/* Per student reset */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Reset Per Siswa</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Cari siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((s, i) => {
                const hasScore = scoreMap.has(s.student_id);
                return (
                  <TableRow key={s.student_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{s.nis}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.class}</TableCell>
                    <TableCell className="text-center">
                      {hasScore ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />Belum
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasScore}
                        onClick={() => setConfirmResetStudent(s.student_id)}
                        className="gap-1.5"
                      >
                        <RotateCcw className="w-3 h-3" />Reset
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reset All Confirmation */}
      <AlertDialog open={confirmResetAll} onOpenChange={setConfirmResetAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Reset Semua Hasil Ujian?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Tindakan ini akan menghapus <strong>semua data skor ujian</strong> dan tidak dapat dibatalkan. Pastikan Anda sudah mengekspor data yang diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={resetAll} className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Ya, Reset Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Student Confirmation */}
      <AlertDialog open={!!confirmResetStudent} onOpenChange={(open) => !open && setConfirmResetStudent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <RotateCcw className="w-7 h-7 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Reset Hasil Ujian?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Hasil ujian <strong>{resetStudentName}</strong> akan dihapus. Siswa dapat mengerjakan ulang ujian setelah direset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmResetStudent && resetStudent(confirmResetStudent)} className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Ya, Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReset;
