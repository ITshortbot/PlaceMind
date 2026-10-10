'use client';

// ============================================================================
// File: frontend/src/components/ats/AtsReadinessPanel.tsx
// Description: ATS Readiness Report UI displaying:
//              - Overall readiness score and category breakdown
//              - Top 5 prioritized actionable fixes
//              - Itemized rule checklist (headings, contact, bullets, dates, length, keywords)
//              - Deterministic estimation limits disclaimer note
// ============================================================================

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSearch,
  Info,
  Lightbulb,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

export interface ATSRuleItem {
  rule_id: string;
  category: string;
  passed: boolean;
  points: number;
  evidence: string;
  fix: string;
}

export interface ScoreDocResponse {
  overall: number;
  categories: {
    structure?: number;
    formatting?: number;
    keywords?: number;
    semantic?: number;
    [key: string]: number | undefined;
  };
  items: ATSRuleItem[];
  top_fixes: string[];
  limits_note: string;
}

export interface AtsReadinessPanelProps {
  report: ScoreDocResponse | null;
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const AtsReadinessPanel: React.FC<AtsReadinessPanelProps> = ({
  report,
  loading = false,
  onRefresh,
  className = '',
}) => {
  const [showAllRules, setShowAllRules] = useState(false);

  if (loading) {
    return (
      <div
        id="ats-readiness-panel"
        className={`rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 shadow-xl space-y-4 ${className}`}
      >
        <div className="flex items-center gap-3 text-slate-300">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
          <span className="text-sm font-semibold">Auditing ATS Readiness Matrix...</span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div
        id="ats-readiness-panel"
        className={`rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-5 shadow-xl text-center space-y-3 ${className}`}
      >
        <FileSearch className="w-8 h-8 text-slate-500 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-300">ATS Readiness Audit</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Audit this resume against standard ATS parsing heuristics, keyword alignment, and structural rules.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            id="run-ats-audit-btn"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Calculate Readiness Score
          </button>
        )}
      </div>
    );
  }

  const score = Math.round(report.overall);
  const scoreBadgeColor =
    score >= 80
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      : score >= 60
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

  const categoryLabels: Record<string, string> = {
    structure: 'Structure & Sections',
    formatting: 'Formatting & Bullets',
    keywords: 'Keyword Coverage',
    semantic: 'Semantic Alignment',
  };

  return (
    <div
      id="ats-readiness-panel"
      className={`rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 shadow-xl space-y-6 ${className}`}
    >
      {/* ─── Header: Score & Badge ─── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              ATS Readiness Audit
            </h2>
            <span className="text-xs text-slate-400">
              Deterministic parsing & structural analysis
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            id="ats-overall-score"
            className={`px-3 py-1 rounded-full text-base font-bold border ${scoreBadgeColor}`}
          >
            {score}/100
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Re-run ATS Audit"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Category Sub-Scores ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(report.categories).map(([catKey, val]) => {
          if (val === undefined) return null;
          const catVal = Math.round(val);
          return (
            <div
              key={catKey}
              className="bg-slate-950/40 border border-white/5 rounded-xl p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{categoryLabels[catKey] || catKey}</span>
                <span className="font-semibold text-slate-200">{catVal}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    catVal >= 80 ? 'bg-emerald-500' : catVal >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, catVal))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Top 5 Actionable Fixes ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 uppercase tracking-wider">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Top Actionable Recommendations</span>
        </div>
        <div className="space-y-2">
          {report.top_fixes.slice(0, 5).map((fix, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-xs text-slate-300 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 leading-relaxed"
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{fix}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Detailed Rule Checklist ─── */}
      <div className="space-y-3 pt-2 border-t border-white/10">
        <button
          onClick={() => setShowAllRules(!showAllRules)}
          id="toggle-rule-details-btn"
          className="w-full flex items-center justify-between text-xs font-medium text-slate-400 hover:text-slate-200 py-1 transition-colors cursor-pointer"
        >
          <span>Rule Heuristic Breakdown ({report.items.filter((i) => i.passed).length}/{report.items.length} Passed)</span>
          {showAllRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAllRules && (
          <div className="space-y-2.5 pt-1">
            {report.items.map((item) => (
              <div
                key={item.rule_id}
                className="bg-slate-950/50 border border-white/5 rounded-xl p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium text-slate-200">
                    {item.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="capitalize">{item.rule_id.replace(/_/g, ' ')}</span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.passed
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {Math.round(item.points)} pts
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] pl-6 leading-relaxed">{item.evidence}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Mandatory Limits Disclaimer Note ─── */}
      <div
        id="ats-limits-note"
        className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 flex items-start gap-2.5 text-xs text-blue-300 leading-relaxed"
      >
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px]">{report.limits_note}</p>
      </div>
    </div>
  );
};
