"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Activity, FileText, Mic, Loader2, Sparkles, CheckCircle2, ShieldCheck, Briefcase } from "lucide-react";

import { uploadResume, submitJD, analyzeMatch } from "@/lib/api";
import GapReportView from "@/components/GapReportView";
import PdfGeneratorView from "@/components/PdfGeneratorView";
import InterviewRoom from "@/components/InterviewRoom";

export default function Home() {
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jdId, setJdId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcessUpload = async () => {
    if (!file || (!jdText.trim() && !jdUrl.trim())) return;
    setLoading(true);
    setStatusMessage("Uploading resume PDF & ingesting Job Description...");

    try {
      // 1. Upload Resume
      const resData = await uploadResume(file);
      setResumeId(resData.resume_id);

      // 2. Submit JD
      const jdData = await submitJD({ text: jdText.trim() || undefined, url: jdUrl.trim() || undefined });
      setJdId(jdData.jd_id);

      // 3. Start Analysis
      setStatusMessage("Computing pgvector semantic gap matrix...");
      const matchData = await analyzeMatch(jdData.jd_id, resData.resume_id);
      setMatchId(matchData.match_id);

      setLoading(false);
      setActiveTab("ats");
    } catch (err: any) {
      console.error(err);
      setStatusMessage("Error: " + (err.message || "Failed to process request"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans flex flex-col">
      {/* WinUI 3 / LinkedIn Style Header Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">Place<span className="text-indigo-400">Mind</span></span>
            <span className="ml-2 text-[10px] font-semibold tracking-wider uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">AI Career Suite</span>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Docling & NER: Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>pgvector: Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Ollama AI: Local</span>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="flex-1 container max-w-7xl mx-auto p-6 lg:p-10 flex flex-col gap-8">
        
        {/* Workspace Title Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Career Acceleration Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              End-to-end AI workflow: Parse resumes, calculate ATS gap vectors, generate optimized PDFs, and practice live mock interviews.
            </p>
          </div>
          {matchId && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-3.5 py-2 rounded-xl font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Active Candidate Session
            </div>
          )}
        </div>

        {/* Main WinUI 3 Tabs Workspace */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl h-14 mb-8">
            <TabsTrigger 
              value="upload" 
              className="rounded-xl text-sm font-medium transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 h-full flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" /> 1. Upload & Ingest
            </TabsTrigger>
            <TabsTrigger 
              value="ats" 
              disabled={!matchId}
              className="rounded-xl text-sm font-medium transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 h-full flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <Activity className="w-4 h-4" /> 2. ATS Gap Matrix
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              disabled={!matchId}
              className="rounded-xl text-sm font-medium transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 h-full flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <FileText className="w-4 h-4" /> 3. PDF Generator
            </TabsTrigger>
            <TabsTrigger 
              value="interview" 
              disabled={!matchId}
              className="rounded-xl text-sm font-medium transition-all data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 h-full flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <Mic className="w-4 h-4" /> 4. Live AI Interview
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: UPLOAD & INGEST */}
          <TabsContent value="upload" className="w-full">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 lg:p-10 backdrop-blur-xl shadow-2xl space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-indigo-400" /> Ingest Resume & Job Target
                </h2>
                <p className="text-slate-400 text-sm mt-1">Provide candidate PDF resume and target Job Description for deep semantic alignment.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* PDF Drag and Drop Container */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Candidate Resume (PDF)</label>
                  <div className="flex-1 min-h-[220px] border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-2xl p-6 text-center hover:bg-indigo-500/5 transition-all cursor-pointer relative group flex flex-col items-center justify-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-7 h-7 text-indigo-400" />
                    </div>
                    {file ? (
                      <div>
                        <p className="text-emerald-400 font-semibold text-base flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> {file.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for Docling extraction</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-slate-200 font-semibold text-base mb-1">Click or drag PDF resume here</p>
                        <p className="text-xs text-slate-500">Supports standard single/multi-page PDFs up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Job Description Text Area */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Job Description (Text or URL)</label>
                  <textarea
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="Paste job description text here (requirements, responsibilities, skills)..."
                    className="w-full flex-1 min-h-[160px] bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={jdUrl}
                      onChange={(e) => setJdUrl(e.target.value)}
                      placeholder="Or paste Job Posting URL (e.g. LinkedIn/Lever)..."
                      className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {statusMessage && (
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm text-center flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> {statusMessage}
                </div>
              )}

              <div className="flex justify-end border-t border-slate-800/80 pt-6">
                <button
                  onClick={handleProcessUpload}
                  disabled={!file || (!jdText.trim() && !jdUrl.trim()) || loading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-40 flex items-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Running Pipeline A & B...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Analyze Candidate Match
                    </>
                  )}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ATS GAP MATRIX */}
          <TabsContent value="ats" className="w-full">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 lg:p-10 backdrop-blur-xl shadow-2xl">
              {matchId ? (
                <GapReportView matchId={matchId} />
              ) : (
                <p className="text-center text-slate-500 py-12">Please upload a resume and JD to compute the ATS Gap Matrix.</p>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: PDF GENERATOR */}
          <TabsContent value="generate" className="w-full">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 lg:p-10 backdrop-blur-xl shadow-2xl">
              {matchId ? (
                <PdfGeneratorView matchId={matchId} />
              ) : (
                <p className="text-center text-slate-500 py-12">Please complete ATS gap analysis first.</p>
              )}
            </div>
          </TabsContent>

          {/* TAB 4: LIVE AI INTERVIEW */}
          <TabsContent value="interview" className="w-full">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 lg:p-10 backdrop-blur-xl shadow-2xl">
              {matchId ? (
                <InterviewRoom matchId={matchId} />
              ) : (
                <p className="text-center text-slate-500 py-12">Please complete ATS gap analysis first.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
