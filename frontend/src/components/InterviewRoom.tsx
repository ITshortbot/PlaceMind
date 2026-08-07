"use client";

import { useEffect, useState, useRef } from "react";
import { startInterviewSession, getInterviewReport } from "@/lib/api";
import { Send, Bot, User, Trophy, Sparkles, MessageSquare } from "lucide-react";

interface InterviewRoomProps {
  matchId: string;
}

export default function InterviewRoom({ matchId }: InterviewRoomProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [inputAnswer, setInputAnswer] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [report, setReport] = useState<any>(null);

  const socketRef = useRef<WebSocket | null>(null);

  const initSession = async () => {
    try {
      const res = await startInterviewSession(matchId);
      setSessionId(res.session_id);
    } catch (err) {
      console.error("Failed to start interview session", err);
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = `ws://localhost:8000/api/v1/interview/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "stream_start") {
        setIsStreaming(true);
        setCurrentQuestion("");
      } else if (data.type === "stream_token") {
        setCurrentQuestion((prev) => prev + data.token);
      } else if (data.type === "stream_end") {
        setIsStreaming(false);
        setMessages((prev) => [...prev, { role: "assistant", text: data.full_question }]);
        setCurrentQuestion("");
      } else if (data.type === "score_eval") {
        setMessages((prev) => [
          ...prev,
          { role: "eval", score: data.score }
        ]);
      } else if (data.type === "session_complete") {
        setSessionComplete(true);
        fetchReport(sessionId);
      }
    };

    return () => {
      ws.close();
    };
  }, [sessionId]);

  const fetchReport = async (sid: string) => {
    try {
      const res = await getInterviewReport(sid);
      setReport(res);
    } catch (err) {
      console.error("Failed to fetch report", err);
    }
  };

  const handleSend = () => {
    if (!inputAnswer.trim() || !socketRef.current) return;
    const text = inputAnswer;
    setMessages((prev) => [...prev, { role: "user", text }]);
    socketRef.current.send(JSON.stringify({ type: "answer", answer: text }));
    setInputAnswer("");
  };

  if (!sessionId) {
    return (
      <div className="p-10 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-5 max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <Bot className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Adaptive AI Mock Interviewer</h3>
          <p className="text-slate-400 text-sm mt-1">Practice realistic technical & behavioral questions probing your exact ATS weak areas.</p>
        </div>
        <button
          onClick={initSession}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm flex items-center gap-2 mx-auto"
        >
          <Sparkles className="w-4 h-4" /> Start Mock Interview Session
        </button>
      </div>
    );
  }

  if (sessionComplete && report) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-2xl text-center space-y-3">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-2xl font-bold text-emerald-300">Mock Interview Complete!</h3>
          <p className="text-slate-300 text-sm">Overall Communication Score: <span className="font-bold text-white text-lg">{report.overall_communication_score}%</span></p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-500 block mb-1">Relevance</span>
            <span className="text-xl font-bold text-white">{Math.round(report.avg_relevance * 100)}%</span>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-500 block mb-1">STAR Structure</span>
            <span className="text-xl font-bold text-white">{Math.round(report.avg_star_structure * 100)}%</span>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 text-center">
            <span className="text-xs text-slate-500 block mb-1">Specificity</span>
            <span className="text-xl font-bold text-white">{Math.round(report.avg_specificity * 100)}%</span>
          </div>
        </div>

        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800 space-y-2">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-indigo-400">Interviewer Summary & Recommendations</h4>
          <p className="text-slate-200 text-sm leading-relaxed">{report.summary_feedback}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-slate-950/60 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
      <div className="flex-1 overflow-y-auto space-y-4 pr-3">
        {messages.map((m, i) => (
          <div key={i}>
            {m.role === "assistant" && (
              <div className="flex gap-3 max-w-[80%]">
                <Bot className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 p-1.5 shrink-0 border border-indigo-500/30" />
                <div className="bg-slate-900 border border-slate-800 text-slate-100 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm">
                  {m.text}
                </div>
              </div>
            )}
            {m.role === "user" && (
              <div className="flex gap-3 max-w-[80%] ml-auto justify-end">
                <div className="bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-sm">
                  {m.text}
                </div>
                <User className="w-8 h-8 rounded-xl bg-indigo-600 text-white p-1.5 shrink-0" />
              </div>
            )}
            {m.role === "eval" && (
              <div className="my-2.5 p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> STAR: {Math.round(m.score.structure_star * 100)}% | Specificity: {Math.round(m.score.specificity * 100)}%
                </span>
                <span className="text-emerald-400 font-medium">Evaluated</span>
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="flex gap-3 max-w-[80%]">
            <Bot className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 p-1.5 shrink-0 animate-pulse border border-indigo-500/30" />
            <div className="bg-slate-900 border border-slate-800 text-indigo-200 p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed italic">
              {currentQuestion}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800/80">
        <input
          type="text"
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your answer using the STAR method..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-sans"
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
