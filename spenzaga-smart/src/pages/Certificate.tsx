import { useLocation, useNavigate } from "react-router-dom";
import { ScoreRecord, Student } from "@/types/exam";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import jsPDF from "jspdf";

const Certificate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    score: ScoreRecord;
    totalPoints: number;
    maxPoints: number;
    student: Student;
  } | null;

  if (!state) {
    navigate("/");
    return null;
  }

  const { score, totalPoints, maxPoints, student } = state;
  const scoreValue = score.total_score !== undefined ? score.total_score : totalPoints;
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const handleDownload = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const w = 297;
    const h = 210;

    // Background gradient simulation
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, w, h, "F");
    doc.setFillColor(226, 232, 240);
    doc.rect(0, h * 0.6, w, h * 0.4, "F");

    // Outer border
    doc.setDrawColor(26, 68, 128);
    doc.setLineWidth(1.2);
    doc.roundedRect(8, 8, w - 16, h - 16, 4, 4, "S");

    // Inner border
    doc.setDrawColor(212, 160, 23);
    doc.setLineWidth(0.4);
    doc.roundedRect(12, 12, w - 24, h - 24, 3, 3, "S");

    const cx = w / 2;

    // School name
    doc.setFontSize(11);
    doc.setTextColor(26, 68, 128);
    doc.setFont("helvetica", "normal");
    doc.text("SMP NEGERI 1 PURBALINGGA", cx, 35, { align: "center" });

    // Title
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 68, 128);
    doc.text("SERTIFIKAT", cx, 50, { align: "center" });

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Computer Based Test", cx, 58, { align: "center" });

    // Divider line
    doc.setDrawColor(212, 160, 23);
    doc.setLineWidth(0.5);
    doc.line(cx - 40, 63, cx + 40, 63);

    // "Diberikan kepada:"
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text("Diberikan kepada:", cx, 73, { align: "center" });

    // Student name
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(student.name, cx, 85, { align: "center" });

    // NIS & Class
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`NIS: ${student.nis}   |   Kelas: ${student.class}`, cx, 93, { align: "center" });

    // Score box
    const boxW = 60;
    const boxH = 36;
    const boxX = cx - boxW / 2;
    const boxY = 100;
    doc.setFillColor(26, 68, 128);
    doc.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "F");

    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(String(scoreValue), cx, boxY + 22, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text("Nilai Ujian", cx, boxY + 31, { align: "center" });

    // Status & Duration
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.text(`Status: ${score.status}`, cx, 148, { align: "center" });
    doc.text(`Durasi: ${score.duration}`, cx, 155, { align: "center" });

    // Footer left - Date
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Tanggal", 30, 172);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(today, 30, 179);

    // Footer right - Principal
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Kepala Sekolah", w - 30, 172, { align: "right" });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(w - 80, 190, w - 30, 190);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text("NIP. _______________", w - 30, 195, { align: "right" });

    doc.save(`Sertifikat_CBT_${student.name.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Sertifikat</h1>
          <Button onClick={handleDownload} className="ml-auto gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>

        {/* Preview */}
        <div className="overflow-auto rounded-xl border shadow-sm">
          <div
            style={{
              width: "800px",
              aspectRatio: "297/210",
              padding: "40px 50px",
              background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
              position: "relative",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            }}
          >
            <div style={{ position: "absolute", inset: "12px", border: "3px solid #1a4480", borderRadius: "12px" }} />
            <div style={{ position: "absolute", inset: "18px", border: "1px solid #d4a017", borderRadius: "8px" }} />

            <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "10px 40px" }}>
              <h2 style={{ fontSize: "13px", color: "#1a4480", margin: "0 0 4px", letterSpacing: "2px", textTransform: "uppercase" }}>
                SMP Negeri 1 Purbalingga
              </h2>
              <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#1a4480", margin: "8px 0 2px", letterSpacing: "4px" }}>
                SERTIFIKAT
              </h1>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px" }}>Computer Based Test</p>

              <div style={{ width: "80px", height: "1px", background: "#d4a017", margin: "8px auto 16px" }} />

              <p style={{ fontSize: "12px", color: "#475569", margin: "0 0 6px" }}>Diberikan kepada:</p>
              <h3 style={{ fontSize: "26px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{student.name}</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px" }}>
                NIS: {student.nis} &nbsp;|&nbsp; Kelas: {student.class}
              </p>

              <div
                style={{
                  display: "inline-block",
                  background: "#1a4480",
                  padding: "12px 36px",
                  borderRadius: "8px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ fontSize: "32px", fontWeight: 800, color: "#fff" }}>{scoreValue}</div>
                <div style={{ fontSize: "11px", color: "#cbd5e1" }}>Nilai Ujian</div>
              </div>

              <p style={{ fontSize: "11px", color: "#475569", margin: "8px 0 2px" }}>Status: <strong>{score.status}</strong></p>
              <p style={{ fontSize: "11px", color: "#475569", margin: "0 0 16px" }}>Durasi: {score.duration}</p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "8px" }}>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0 }}>Tanggal</p>
                  <p style={{ fontSize: "12px", color: "#0f172a", fontWeight: 600, margin: 0 }}>{today}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", color: "#94a3b8", margin: 0 }}>Kepala Sekolah</p>
                  <div style={{ borderBottom: "1px solid #cbd5e1", width: "130px", marginBottom: "4px", marginTop: "24px" }} />
                  <p style={{ fontSize: "10px", color: "#64748b", margin: 0 }}>NIP. _______________</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Certificate;
