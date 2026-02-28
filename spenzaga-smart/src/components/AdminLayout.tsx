import { useEffect, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Users, FileText, Trophy, BarChart3, PieChart, RotateCcw, LogOut, Menu, X, Shield, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/admin/participants", label: "Peserta Ujian", icon: Users },
  { path: "/admin/questions", label: "Bank Soal", icon: FileText },
  { path: "/admin/results", label: "Hasil Ujian", icon: Trophy },
  { path: "/admin/answer-analysis", label: "Analisis Jawaban", icon: ClipboardList },
  { path: "/admin/analysis", label: "Analisis Soal", icon: PieChart },
  { path: "/admin/statistics", label: "Statistik", icon: BarChart3 },
  { path: "/admin/reset", label: "Reset & Akses", icon: RotateCcw },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const admin = sessionStorage.getItem("cbt_admin");
    if (!admin) navigate("/admin/login");
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("cbt_admin");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-foreground">Admin CBT</h2>
            <p className="text-xs text-muted-foreground">SMPN 1 Purbalingga</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">
            {navItems.find((n) => n.path === location.pathname)?.label || "Admin"}
          </h1>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
