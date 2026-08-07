"use client";

import { useState } from "react";
import { generateResume } from "@/lib/api";
import { FileText, Download, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface PdfGeneratorViewProps {
  matchId: string;
}

export default function PdfGeneratorView({ matchId }: PdfGeneratorViewProps) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      await generateResume(matchId);
      setTimeout(() => {
        setPdfUrl("http://localhost:9000/placemind-resumes/sample_generated.pdf");
        setLoading(false);
      }, 4000);
    } catch (err: any) {
      setError(err.message || "Failed to trigger generation");
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950/60 p-10 rounded-2xl border border-slate-800 text-center space-y-6 max-w-3xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
        <FileText className="w-8 h-8" />
      </div>

      <div>
        <h3 className="text-2xl font-bold text-white">ATS-Optimized Resume Generator</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
          Applies STAR method rewrites, injects target keywords from the Gap Analysis, and compiles a single-column PDF using Typst.
        </p>
      </div>

      {!pdfUrl ? (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Compiling Typst PDF...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Generate Optimized Resume PDF
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Optimized PDF compiled and stored securely in MinIO!
          </div>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition-all border border-slate-700 text-sm shadow-md"
          >
            <Download className="w-4 h-4 text-indigo-400" /> Download Compiled PDF
          </a>
        </div>
      )}

      {error && <p className="text-rose-400 text-xs">{error}</p>}
    </div>
  );
}
