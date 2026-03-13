const VLM_BASE = 'http://localhost:8000';

export interface Bbox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Candidate {
  type: string;
  variant: string;
  confidence: number;
}

export interface Boundary {
  id: string;
  bbox: Bbox;
  candidates: Candidate[];
}

export interface AnalysisResult {
  boundaries: Boundary[];
  image_width: number;
  image_height: number;
}

export interface Selection {
  id: string;
  type: string;
  variant: string;
  bbox: Bbox;
}

export interface LayoutConfig {
  sections: any[];
}

export interface SubmitResult {
  status: string;
  count: number;
  layout_config: LayoutConfig;
}

export type SessionStatus =
  | 'uploaded'
  | 'analyzing'
  | 'analyzed'
  | 'generating_config'
  | 'submitted'
  | 'error';

export interface SessionState {
  session_id: string;
  status: SessionStatus;
  analysis?: AnalysisResult;
  selections?: Selection[] | null;
}

export async function uploadImage(file: File): Promise<{ session_id: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${VLM_BASE}/api/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Upload failed: ${res.status}` }));
    throw new Error(body.detail || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function analyzeImage(sessionId: string): Promise<AnalysisResult> {
  const res = await fetch(`${VLM_BASE}/api/analyze/${encodeURIComponent(sessionId)}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Analysis failed: ${res.status}` }));
    throw new Error(body.detail || `Analysis failed: ${res.status}`);
  }
  return res.json();
}

export async function submitSelections(
  sessionId: string,
  selections: Selection[]
): Promise<SubmitResult> {
  const res = await fetch(`${VLM_BASE}/api/submit/${encodeURIComponent(sessionId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selections }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Submit failed: ${res.status}` }));
    throw new Error(body.detail || `Submit failed: ${res.status}`);
  }
  return res.json();
}

export function getSessionImageUrl(sessionId: string): string {
  return `${VLM_BASE}/api/session/${encodeURIComponent(sessionId)}/image`;
}

export async function getSessionStatus(sessionId: string): Promise<SessionState> {
  const res = await fetch(`${VLM_BASE}/api/session/${encodeURIComponent(sessionId)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Session fetch failed: ${res.status}` }));
    throw new Error(body.detail || `Session fetch failed: ${res.status}`);
  }
  return res.json();
}
