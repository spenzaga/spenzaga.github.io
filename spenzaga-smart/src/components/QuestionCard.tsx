import { useState, useEffect, useMemo } from "react";
import { Question } from "@/types/exam";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  question: Question;
  index: number;
  answer: string | string[] | undefined;
  onChange: (val: string | string[]) => void;
  hideHeader?: boolean;
}

const clean = (s: string) => s.replace(/^\*/, "");

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const QuestionCard = ({ question, index, answer, onChange, hideHeader }: Props) => {
  const options = useMemo(
    () => [question.answer_1, question.answer_2, question.answer_3, question.answer_4].filter(Boolean),
    [question]
  );

  const mgPairs = useMemo(() => {
    if (question.question_type !== "MG") return [];
    return options.map((o) => { const [left, right] = o.split("|"); return { left, right }; });
  }, [question.question_type, options]);

  const mgRightOptions = useMemo(() => shuffle(mgPairs.map((p) => p.right)), [mgPairs]);

  const [seqItems, setSeqItems] = useState<string[]>([]);
  useEffect(() => {
    if (question.question_type === "SEQ") {
      if (answer && Array.isArray(answer) && answer.length > 0) setSeqItems(answer);
      else { const shuffled = shuffle(options); setSeqItems(shuffled); onChange(shuffled); }
    }
  }, [question.question_id]);

  const moveSeq = (from: number, to: number) => {
    const newItems = [...seqItems];
    [newItems[from], newItems[to]] = [newItems[to], newItems[from]];
    setSeqItems(newItems);
    onChange(newItems);
  };

  const [mgMatches, setMgMatches] = useState<Record<string, string>>(() => {
    if (question.question_type === "MG" && Array.isArray(answer)) {
      const m: Record<string, string> = {};
      (answer as string[]).forEach((pair) => { const [l, r] = pair.split("|"); m[l] = r; });
      return m;
    }
    return {};
  });

  const handleMgChange = (left: string, right: string) => {
    const newM = { ...mgMatches, [left]: right };
    setMgMatches(newM);
    onChange(Object.entries(newM).map(([l, r]) => `${l}|${r}`));
  };

  const renderMedia = () => (
    <div className="space-y-3 mb-4">
      {question.image && <img src={question.image} alt="Soal" className="max-w-full max-h-60 rounded-lg mx-auto" />}
      {question.video && <video controls className="max-w-full max-h-60 rounded-lg mx-auto"><source src={question.video} type="video/mp4" /></video>}
      {question.audio && <audio controls className="w-full"><source src={question.audio} type="audio/mpeg" /></audio>}
    </div>
  );

  const typeBadge = () => {
    const labels: Record<string, string> = {
      TF: "Benar / Salah", MC: "Pilihan Ganda", MR: "Jawaban Ganda",
      TI: "Jawaban Singkat", MG: "Menjodohkan", SEQ: "Urutan", NUMG: "Numerik",
    };
    return (
      <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-3">
        {labels[question.question_type] || question.question_type}
      </span>
    );
  };

  const renderAnswers = () => {
    switch (question.question_type) {
      case "TF":
        return (
          <RadioGroup value={(answer as string) || ""} onValueChange={onChange} className="space-y-2">
            {["True", "False"].map((v) => (
              <label key={v} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${answer === v ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                <RadioGroupItem value={v} id={`tf-${v}`} /><span className="font-medium">{v}</span>
              </label>
            ))}
          </RadioGroup>
        );
      case "MC":
        return (
          <RadioGroup value={(answer as string) || ""} onValueChange={onChange} className="space-y-2">
            {options.map((opt, i) => {
              const label = clean(opt);
              return (
                <label key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${answer === label ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <RadioGroupItem value={label} id={`mc-${i}`} /><span>{label}</span>
                </label>
              );
            })}
          </RadioGroup>
        );
      case "MR": {
        const selected = (answer as string[]) || [];
        return (
          <div className="space-y-2">
            {options.map((opt, i) => {
              const label = clean(opt);
              const checked = selected.includes(label);
              return (
                <label key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <Checkbox checked={checked} onCheckedChange={(c) => { const next = c ? [...selected, label] : selected.filter((s) => s !== label); onChange(next); }} />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        );
      }
      case "TI":
        return <Input placeholder="Ketik jawaban Anda..." value={(answer as string) || ""} onChange={(e) => onChange(e.target.value)} className="h-12 text-base" />;
      case "MG":
        return (
          <div className="space-y-3">
            {mgPairs.map((pair) => (
              <div key={pair.left} className="flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-secondary/30">
                <span className="font-medium min-w-[120px]">{pair.left}</span>
                <span className="text-muted-foreground">→</span>
                <Select value={mgMatches[pair.left] || ""} onValueChange={(v) => handleMgChange(pair.left, v)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih jawaban" /></SelectTrigger>
                  <SelectContent>{mgRightOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ))}
          </div>
        );
      case "SEQ":
        return (
          <div className="space-y-2">
            {seqItems.map((item, i) => (
              <div key={item} className="flex items-center gap-2 p-3 rounded-xl border-2 border-border bg-secondary/30">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">{i + 1}</span>
                <span className="flex-1 font-medium">{item}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === 0} onClick={() => moveSeq(i, i - 1)}><ArrowUp className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={i === seqItems.length - 1} onClick={() => moveSeq(i, i + 1)}><ArrowDown className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        );
      case "NUMG":
        return <Input type="number" placeholder="Ketik angka jawaban..." value={(answer as string) || ""} onChange={(e) => onChange(e.target.value)} className="h-12 text-base" />;
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in">
      {!hideHeader && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-primary">Soal {index + 1}</span>
          {typeBadge()}
          <span className="ml-auto text-xs text-muted-foreground">{question.points} poin</span>
        </div>
      )}

      {renderMedia()}

      {question.question_paragraph && (
        <div className="bg-secondary/50 rounded-xl p-4 mb-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: question.question_paragraph }} />
      )}

      <p className="font-semibold text-foreground mb-4 text-base leading-relaxed">{question.question_text}</p>

      {renderAnswers()}
    </div>
  );
};

export default QuestionCard;
