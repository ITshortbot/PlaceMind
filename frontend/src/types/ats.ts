// ============================================================================
// File: frontend/src/types/ats.ts
// Description: Strongly-typed TypeScript interfaces matching the FastAPI backend schema
// ============================================================================

export type MatchStatus = 'covered' | 'weak' | 'missing';
export type AIMode = 'cloud' | 'local';

export interface RequirementGapItem {
  requirement: string;
  match_status: MatchStatus;
  similarity_score: number;
  matched_resume_section: string | null;
  matched_snippet: string | null;
  improvement_suggestion: string;
}

export interface ParsedSection {
  section_type: string;
  content: string;
}

export interface ModelAuditMetadata {
  model_used: string;
  routing_mode: string;
  latency_ms: number;
  is_fallback: boolean;
  embedding_dimension: number;
}

export interface ATSGapReport {
  overall_score: number;
  semantic_score: number;
  keyword_score: number;
  status_summary: 'High Match' | 'Moderate Match' | 'Needs Optimization';
  gap_matrix: RequirementGapItem[];
  missing_keywords: string[];
  detected_strengths: string[];
  actionable_bullet_points: string[];
  parsed_sections: ParsedSection[];
  pdf_r2_url: string | null;
  processing_metadata: ModelAuditMetadata;
}

export interface ScoreResumeParams {
  file: File;
  jobTitle: string;
  jobDescription: string;
  mode?: AIMode;
}
