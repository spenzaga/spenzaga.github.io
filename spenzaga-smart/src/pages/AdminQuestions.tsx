import { useState, useEffect, useRef } from "react";
import { db, ref, get, set } from "@/lib/firebase";
import { Question } from "@/types/exam";
import { exportToExcel, importFromExcel } from "@/lib/excelUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, Upload, Plus, Pencil, Trash2, Search, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const typeLabels: Record<string, string> = {
  TF: "Benar/Salah", MC: "Pilihan Ganda", MR: "Jawaban Ganda",
  TI: "Isian Singkat", MG: "Menjodohkan", SEQ: "Urutan", NUMG: "Numerik",
};

const emptyForm: Question = {
  question_id: "", question_type: "MC", image: "", video: "", audio: "",
  question_paragraph: "", question_text: "",
  answer_1: "", answer_2: "", answer_3: "", answer_4: "",
  correct_feedback: "Well done!", incorrect_feedback: "Sorry, the answer is incorrect...",
  points: "10",
};

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQ, setEditQ] = useState<Question | null>(null);
  const [form, setForm] = useState<Question>({ ...emptyForm });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await get(ref(db, "questions"));
      if (snap.exists()) {
        const d = snap.val();
        setQuestions(Array.isArray(d) ? d : Object.values(d));
      }
    } catch { toast({ title: "Error", description: "Gagal memuat soal", variant: "destructive" }); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditQ(null);
    setForm({ ...emptyForm, question_id: `Q${questions.length + 1}` });
    setDialogOpen(true);
  };

  const openEdit = (q: Question) => { setEditQ(q); setForm({ ...q }); setDialogOpen(true); };

  const save = async () => {
    const updated = editQ
      ? questions.map((q) => (q.question_id === editQ.question_id ? { ...form } : q))
      : [...questions, { ...form }];
    await set(ref(db, "questions"), updated);
    setQuestions(updated);
    setDialogOpen(false);
    toast({ title: "Berhasil", description: editQ ? "Soal diperbarui" : "Soal ditambahkan" });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const updated = questions.filter((q) => q.question_id !== deleteId);
    await set(ref(db, "questions"), updated);
    setQuestions(updated);
    setDeleteId(null);
    toast({ title: "Dihapus" });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importFromExcel(file);
      const mapped: Question[] = data.map((row: any, i: number) => ({
        question_id: row.question_id || `Q${questions.length + i + 1}`,
        question_type: row.question_type || "MC",
        image: row.image || "", video: row.video || "", audio: row.audio || "",
        question_paragraph: row.question_paragraph || "",
        question_text: row.question_text || "",
        answer_1: row.answer_1 || "", answer_2: row.answer_2 || "",
        answer_3: row.answer_3 || "", answer_4: row.answer_4 || "",
        correct_feedback: row.correct_feedback || "Well done!",
        incorrect_feedback: row.incorrect_feedback || "Sorry, the answer is incorrect...",
        points: String(row.points || "10"),
      }));
      const merged = [...questions, ...mapped];
      await set(ref(db, "questions"), merged);
      setQuestions(merged);
      toast({ title: "Impor berhasil", description: `${mapped.length} soal ditambahkan` });
    } catch { toast({ title: "Error", description: "Format tidak valid", variant: "destructive" }); }
    e.target.value = "";
  };

  const handleExport = () => {
    const data = questions.map((q, i) => ({
      No: i + 1,
      question_id: q.question_id,
      question_type: q.question_type,
      image: q.image,
      video: q.video,
      audio: q.audio,
      question_paragraph: q.question_paragraph,
      question_text: q.question_text,
      answer_1: q.answer_1,
      answer_2: q.answer_2,
      answer_3: q.answer_3,
      answer_4: q.answer_4,
      correct_feedback: q.correct_feedback,
      incorrect_feedback: q.incorrect_feedback,
      points: q.points,
    }));
    exportToExcel(data, "Bank_Soal");
  };

  const filtered = questions.filter(
    (q) => q.question_text.toLowerCase().includes(search.toLowerCase()) || q.question_id.toLowerCase().includes(search.toLowerCase())
  );

  const deleteQuestionText = deleteId ? questions.find(q => q.question_id === deleteId)?.question_text : "";

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari soal..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={openAdd} className="gap-1.5"><Plus className="w-4 h-4" />Tambah</Button>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} className="gap-1.5"><Upload className="w-4 h-4" />Impor</Button>
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5"><Download className="w-4 h-4" />Ekspor</Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="w-36">Tipe Soal</TableHead>
                <TableHead>Soal</TableHead>
                <TableHead className="w-16 text-center">Poin</TableHead>
                <TableHead className="text-right w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q, i) => (
                <TableRow key={q.question_id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{q.question_id}</TableCell>
                  <TableCell>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full whitespace-nowrap">
                      {typeLabels[q.question_type] || q.question_type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{q.question_text}</TableCell>
                  <TableCell className="text-center">{q.points}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(q)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(q.question_id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editQ ? "Edit Soal" : "Tambah Soal"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.question_type} onValueChange={(v) => setForm({ ...form, question_type: v as Question["question_type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Poin" value={form.points} onChange={(e) => setForm({ ...form, points: e.target.value })} />
            </div>
            <Input placeholder="URL Gambar" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            <Input placeholder="URL Video" value={form.video} onChange={(e) => setForm({ ...form, video: e.target.value })} />
            <Input placeholder="URL Audio" value={form.audio} onChange={(e) => setForm({ ...form, audio: e.target.value })} />
            <Textarea placeholder="Paragraf (opsional)" value={form.question_paragraph} onChange={(e) => setForm({ ...form, question_paragraph: e.target.value })} />
            <Textarea placeholder="Teks Soal" value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Jawaban 1 (* = benar)" value={form.answer_1} onChange={(e) => setForm({ ...form, answer_1: e.target.value })} />
              <Input placeholder="Jawaban 2" value={form.answer_2} onChange={(e) => setForm({ ...form, answer_2: e.target.value })} />
              <Input placeholder="Jawaban 3" value={form.answer_3} onChange={(e) => setForm({ ...form, answer_3: e.target.value })} />
              <Input placeholder="Jawaban 4" value={form.answer_4} onChange={(e) => setForm({ ...form, answer_4: e.target.value })} />
            </div>
            <Input placeholder="Feedback benar" value={form.correct_feedback} onChange={(e) => setForm({ ...form, correct_feedback: e.target.value })} />
            <Input placeholder="Feedback salah" value={form.incorrect_feedback} onChange={(e) => setForm({ ...form, incorrect_feedback: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save}>Simpan</Button>
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
            <AlertDialogTitle className="text-center">Hapus Soal?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Soal "<strong>{deleteQuestionText?.substring(0, 50)}{(deleteQuestionText?.length || 0) > 50 ? "..." : ""}</strong>" akan dihapus secara permanen.
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

export default AdminQuestions;
