import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ExamProvider } from "@/context/ExamContext";
import Login from "./pages/Login";
import Confirmation from "./pages/Confirmation";
import Exam from "./pages/Exam";
import Result from "./pages/Result";
import Review from "./pages/Review";
import Certificate from "./pages/Certificate";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminParticipants from "./pages/AdminParticipants";
import AdminQuestions from "./pages/AdminQuestions";
import AdminResults from "./pages/AdminResults";
import AdminAnalysis from "./pages/AdminAnalysis";
import AdminStatistics from "./pages/AdminStatistics";
import AdminReset from "./pages/AdminReset";
import AdminAnswerAnalysis from "./pages/AdminAnswerAnalysis";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ExamProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/confirmation" element={<Confirmation />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/result" element={<Result />} />
            <Route path="/review" element={<Review />} />
            <Route path="/certificate" element={<Certificate />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="participants" element={<AdminParticipants />} />
              <Route path="questions" element={<AdminQuestions />} />
              <Route path="results" element={<AdminResults />} />
              <Route path="analysis" element={<AdminAnalysis />} />
              <Route path="answer-analysis" element={<AdminAnswerAnalysis />} />
              <Route path="statistics" element={<AdminStatistics />} />
              <Route path="reset" element={<AdminReset />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ExamProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
