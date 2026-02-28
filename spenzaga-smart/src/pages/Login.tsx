import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, ref, get } from "@/lib/firebase";
import { useExam } from "@/context/ExamContext";
import { Student } from "@/types/exam";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LogIn, Loader2 } from "lucide-react";

const Login = () => {
  const [nis, setNis] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setStudent } = useExam();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!nis.trim()) return;
    setLoading(true);
    setError("");
    try {
      const snapshot = await get(ref(db, "students"));
      if (snapshot.exists()) {
        const students: Student[] = snapshot.val();
        const found = students.find((s) => s.nis === nis.trim());
        if (found) {
          setStudent(found);
          navigate("/confirmation");
        } else {
          setError("NIS tidak ditemukan. Silakan periksa kembali.");
        }
      } else {
        setError("Data siswa belum tersedia.");
      }
    } catch {
      setError("Gagal terhubung ke server. Periksa koneksi internet.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0 animate-fade-in">
        <CardHeader className="text-center pb-2 pt-8">
          <img
            src="https://spenzaga.github.io/assets/img/logo.png"
            alt="Logo SMP Negeri 1 Purbalingga"
            className="w-24 h-24 mx-auto mb-4 drop-shadow-md"
          />
          <h1 className="text-2xl font-bold text-primary">
            Computer Based Test
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            SMP Negeri 1 Purbalingga
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-8 pb-8">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Nomor Induk Siswa (NIS)
            </label>
            <Input
              placeholder="Masukkan NIS"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="h-12 text-center text-lg tracking-widest font-semibold"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg p-2">
              {error}
            </p>
          )}
          <Button
            className="w-full h-12 text-base font-semibold gap-2"
            onClick={handleLogin}
            disabled={loading || !nis.trim()}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {loading ? "Memuat..." : "Masuk"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
