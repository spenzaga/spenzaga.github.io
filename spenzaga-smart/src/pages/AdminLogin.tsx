import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, ref, get } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const snapshot = await get(ref(db, "admin"));
      if (snapshot.exists()) {
        const admins = snapshot.val();
        const list = Array.isArray(admins) ? admins : Object.values(admins);
        const found = (list as any[]).find(
          (a) => a.username === username.trim() && a.password === password.trim()
        );
        if (found) {
          sessionStorage.setItem("cbt_admin", JSON.stringify(found));
          navigate("/admin/participants");
        } else {
          setError("Username atau password salah.");
        }
      } else {
        setError("Data admin belum tersedia.");
      }
    } catch {
      setError("Gagal terhubung ke server.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-0 animate-fade-in">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">SMP Negeri 1 Purbalingga</p>
        </CardHeader>
        <CardContent className="space-y-4 px-8 pb-8">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Username</label>
            <Input
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-12"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <Input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="h-12"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg p-2">{error}</p>
          )}
          <Button className="w-full h-12 text-base font-semibold gap-2" onClick={handleLogin} disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {loading ? "Memuat..." : "Masuk"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
