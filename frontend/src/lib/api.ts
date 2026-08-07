const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/v1/resume/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload resume");
  }

  return res.json();
}

export async function submitJD(data: { url?: string; text?: string }) {
  const res = await fetch(`${API_BASE}/api/v1/jd/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to submit job description");
  }

  return res.json();
}

export async function analyzeMatch(jd_id: string, resume_id: string) {
  const res = await fetch(`${API_BASE}/api/v1/jd/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jd_id, resume_id }),
  });

  if (!res.ok) {
    throw new Error("Failed to start analysis");
  }

  return res.json();
}

export async function getAnalysisResult(match_id: string) {
  const res = await fetch(`${API_BASE}/api/v1/jd/analyze/${match_id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch analysis result");
  }
  return res.json();
}

export async function generateResume(match_id: string) {
  const res = await fetch(`${API_BASE}/api/v1/resume/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ match_id }),
  });

  if (!res.ok) {
    throw new Error("Failed to trigger resume generation");
  }

  return res.json();
}

export async function startInterviewSession(match_id: string, role_title: string = "Software Engineer") {
  const res = await fetch(`${API_BASE}/api/v1/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ match_id, role_title }),
  });

  if (!res.ok) {
    throw new Error("Failed to start interview session");
  }

  return res.json();
}

export async function getInterviewReport(session_id: string) {
  const res = await fetch(`${API_BASE}/api/v1/interview/${session_id}/report`);
  if (!res.ok) {
    throw new Error("Failed to fetch interview report");
  }
  return res.json();
}
