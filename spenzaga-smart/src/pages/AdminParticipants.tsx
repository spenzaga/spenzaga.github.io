import { useState, useEffect, useRef } from "react";
import { db, ref, get, set } from "@/lib/firebase";
import { Student } from "@/types/exam";
import { exportToExcel, importFromExcel } from "@/lib/excelUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Download, Upload, Plus, Pencil, Trash2, Search, CheckCircle2, Clock, Loader2, AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminParticipants = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ student_id: "", absen: "", nis: "", name: "", class: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studSnap, scoreSnap] = await Promise.all([
        get(ref(db, "students")),
        get(ref(db, "scores")),
      ]);
      if (studSnap.exists()) {
        const data = studSnap.val();
        setStudents(Array.isArray(data) ? data : Object.values(data));
      }
      if (scoreSnap.exists()) {
        const data = scoreSnap.val();
        const map: Record<string, any> = {};
        const list = Array.isArray(data) ? data : Object.values(data);
        (list as any[]).forEach((s: any) => { map[s.student_id] = s; });
        setScores(map);
      }
    } catch { toast({ title: "Error", description: "Gagal memuat data", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditStudent(null);
    const nextId = `S${students.length + 1}`;
    setForm({ student_id: nextId, absen: "", nis: "", name: "", class: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({ ...s });
    setDialogOpen(true);
  };

  const saveStudent = async () => {
    const updated = editStudent
      ? students.map((s) => (s.student_id === editStudent.student_id ? { ...form } : s))
      : [...students, { ...form }];
    await set(ref(db, "students"), updated);
    setStudents(updated);
    setDialogOpen(false);
    toast({ title: "Berhasil", description: editStudent ? "Data diperbarui" : "Siswa ditambahkan" });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const updated = students.filter((s) => s.student_id !== deleteId);
    await set(ref(db, "students"), updated);
    setStudents(updated);
    setDeleteId(null);
    toast({ title: "Dihapus", description: "Siswa berhasil dihapus" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromExcel(file);
      const mapped: Student[] = data.map((row: any, i: number) => ({
        student_id: row.student_id || `S${students.length + i + 1}`,
        absen: String(row.absen || ""),
        nis: String(row.nis || ""),
        name: row.name || "",
        class: row.class || "",
      }));
      const merged = [...students, ...mapped];
      await set(ref(db, "students"), merged);
      setStudents(merged);
      toast({ title: "Impor berhasil", description: `${mapped.length} siswa ditambahkan` });
    } catch { toast({ title: "Error", description: "Format file tidak valid", variant: "destructive" }); }
    e.target.value = "";
  };

  const handleExport = () => {
    const data = filtered.map((s) => ({
      No: s.absen,
      NIS: s.nis,
      Nama: s.name,
      Kelas: s.class,
      Status: scores[s.student_id] ? "Sudah Mengerjakan" : "Belum Mengerjakan",
    }));
    exportToExcel(data, "Peserta_Ujian");
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search) ||
      s.class.toLowerCase().includes(search.toLowerCase())
  );

  const deleteStudentName = deleteId ? students.find(s => s.student_id === deleteId)?.name : "";

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari nama, NIS, kelas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={openAdd} className="gap-1.5"><Plus className="w-4 h-4" />Tambah</Button>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5">
            <Upload className="w-4 h-4" />Impor
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
            <Download className="w-4 h-4" />Ekspor
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </div>
      </div>

      <Card className="border-0 shadow-sm">
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
              {filtered.map((s, i) => (
                <TableRow key={s.student_id}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>{s.nis}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.class}</TableCell>
                  <TableCell className="text-center">
                    {scores[s.student_id] ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />Selesai
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" />Belum
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(s.student_id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Tidak ada data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editStudent ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="No. Absen" value={form.absen} onChange={(e) => setForm({ ...form, absen: e.target.value })} />
            <Input placeholder="NIS" value={form.nis} onChange={(e) => setForm({ ...form, nis: e.target.value })} />
            <Input placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Kelas" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={saveStudent}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Hapus Siswa?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Data siswa <strong>{deleteStudentName}</strong> akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminParticipants;
