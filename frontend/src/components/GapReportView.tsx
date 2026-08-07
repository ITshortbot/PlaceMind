"use client";

import { useEffect, useState } from "react";
import { getAnalysisResult } from "@/lib/api";
import { Activity, CheckCircle2, AlertCircle, XCircle, ShieldCheck, Target, Key, FileCheck } from "lucide-react";

interface GapReportProps {
  matchId: string;
  onAnalysisReady?: () => void;
}

export default function GapReportView({ matchId, onAnalysisReady }: GapReportProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;

    const poll = async () => {
      try {
        const res = await getAnalysisResult(matchId);
        if (res.status === "complete" && res.gap_report) {
          setReport(res.gap_report);
          setLoading(false);
          if (onAnalysisReady) onAnalysisReady();
          clearInterval(interval);
        } else if (res.status === "failed") {
          setError("Analysis processing encountered an error.");
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch gap report");
        setLoading(false);
        clearInterval(interval);
      }
    };

    poll();
    interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  if (loading) {
    return (
      <div className="py-16 text-center space-y-4">
        <Activity className="w-12 h-12 mx-auto animate-spin text-indigo-400" />
        <h3 className="text-xl font-bold text-white">Computing Semantic Match Matrix...</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Executing pgvector cosine similarity calculations across resume chunks and job description requirements.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-rose-500/10 border border-rose-500/30 rounded-2xl">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-400" />
        <p className="text-rose-200 font-medium text-sm">{error}</p>
      </div>
    );
  }

  const scorePct = Math.round((report.overall_score || 0) * 100);

  return (
    <div className="space-y-8">
      {/* Score Header Banner */}
      <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> Weighted Match Assessment
          </div>
          <h3 className="text-2xl font-bold text-white">Overall ATS Match Score</h3>
          <p className="text-slate-400 text-sm mt-1">Composite score based on semantic vector similarity, keyword density, and bullet metrics.</p>
        </div>
        <div className="flex items-baseline gap-2 bg-indigo-500/10 border border-indigo-500/30 px-6 py-4 rounded-2xl">
          <span className="text-5xl font-extrabold text-indigo-400">{scorePct}</span>
          <span className="text-xl text-slate-400 font-semibold">%</span>
        </div>
      </div>

      {/* Subscore Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Target className="w-4 h-4 text-indigo-400" /> Semantic Coverage (40%)
          </div>
          <p className="text-2xl font-bold text-white">{Math.round((report.semantic_coverage_score || 0) * 100)}%</p>
        </div>

        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Key className="w-4 h-4 text-blue-400" /> Keyword Density (25%)
          </div>
          <p className="text-2xl font-bold text-white">{Math.round((report.keyword_density_score || 0) * 100)}%</p>
        </div>

        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Activity className="w-4 h-4 text-purple-400" /> Quantified Impact (20%)
          </div>
          <p className="text-2xl font-bold text-white">{Math.round((report.quantification_score || 0) * 100)}%</p>
        </div>

        <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <FileCheck className="w-4 h-4 text-emerald-400" /> Parseability (15%)
          </div>
          <p className="text-2xl font-bold text-white">{Math.round((report.formatting_score || 0) * 100)}%</p>
        </div>
      </div>

      {/* Missing Keywords Chips */}
      {report.missing_keywords && report.missing_keywords.length > 0 && (
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Missing Key Hard Skills
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {report.missing_keywords.map((kw: string, i: number) => (
              <span key={i} className="bg-rose-500/10 text-rose-300 text-xs font-medium px-3.5 py-1.5 rounded-xl border border-rose-500/20">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Requirement Coverage Breakdown List */}
      {report.requirement_coverages && report.requirement_coverages.length > 0 && (
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detailed Job Requirement Match Matrix</h4>
          <div className="space-y-3">
            {report.requirement_coverages.map((req: any, i: number) => {
              const isWell = req.coverage_label === "well_covered";
              const isWeak = req.coverage_label === "weakly_covered";
              return (
                <div key={i} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start gap-4 transition-all hover:border-slate-700">
                  {isWell && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                  {isWeak && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                  {!isWell && !isWeak && <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-100">{req.requirement}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">Best Matching Chunk: "{req.best_match_chunk}"</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${
                    isWell ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" :
                    isWeak ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  }`}>
                    {req.coverage_label.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
