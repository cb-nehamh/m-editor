const BE_BASE = 'http://localhost:3001';

export interface SaveResponse {
  config: unknown[];
  status: string;
}

export interface FetchResponse {
  config: unknown[];
  status: string;
}

export async function saveConfig(
  domain: string,
  id: string,
  config: unknown[],
  status: 'draft' | 'published'
): Promise<SaveResponse> {
  const res = await fetch(`${BE_BASE}/${encodeURIComponent(domain)}/component/${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config, status }),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status}`);
  return res.json();
}

export async function fetchConfig(
  domain: string,
  id: string
): Promise<FetchResponse | null> {
  const res = await fetch(`${BE_BASE}/${encodeURIComponent(domain)}/component/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}

export async function listConfigs(
  domain: string
): Promise<{ id: string; status: string }[]> {
  const res = await fetch(`${BE_BASE}/${encodeURIComponent(domain)}/components`);
  if (!res.ok) throw new Error(`List failed: ${res.status}`);
  return res.json();
}

export interface PortalSessionResponse {
  token: string;
  access_url: string;
  customer_id: string;
}

export async function createPortalSession(
  domain: string,
  customerId: string
): Promise<PortalSessionResponse> {
  const res = await fetch(`${BE_BASE}/portal-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, customer_id: customerId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Session creation failed: ${res.status}`);
  }
  return res.json();
}
