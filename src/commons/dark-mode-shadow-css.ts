/**
 * CSS overrides injected into each MJS widget's Shadow DOM when dark theme is active.
 * Because MJS widgets render inside shadow roots, external CSS from styles.css cannot
 * reach them. This stylesheet is injected directly into each shadow root instead.
 */
export const DARK_MODE_SHADOW_CSS = `
/* ── Base text color for all elements ── */
* {
  color: #f1f5f9 !important;
}

/* ── Status/designation badges: light backgrounds need dark text ── */
span[style*="border-radius"][style*="background"] {
  color: #0f172a !important;
}

/* ── Badge backgrounds: more vibrant/colourful ── */
span[style*="border-radius"][style*="#fffbeb"],
span[style*="border-radius"][style*="255, 251, 235"] {
  background-color: #fef08a !important;
  border-color: #facc15 !important;
}
span[style*="border-radius"][style*="#ecfdf5"],
span[style*="border-radius"][style*="#d1fae5"],
span[style*="border-radius"][style*="#dcfce7"],
span[style*="border-radius"][style*="236, 253, 245"],
span[style*="border-radius"][style*="209, 250, 229"],
span[style*="border-radius"][style*="220, 252, 231"] {
  background-color: #4ade80 !important;
  border-color: #22c55e !important;
}
span[style*="border-radius"][style*="#fef2f2"],
span[style*="border-radius"][style*="254, 242, 242"] {
  background-color: #fca5a5 !important;
  border-color: #ef4444 !important;
}
span[style*="border-radius"][style*="#eff6ff"],
span[style*="border-radius"][style*="#dbeafe"],
span[style*="border-radius"][style*="239, 246, 255"],
span[style*="border-radius"][style*="219, 234, 254"] {
  background-color: #93c5fd !important;
  border-color: #3b82f6 !important;
}
span[style*="border-radius"][style*="#f3f4f6"],
span[style*="border-radius"][style*="243, 244, 246"] {
  background-color: #94a3b8 !important;
  border-color: #64748b !important;
}

h1, h2, h3, h4, h5, h6 {
  color: #ffffff !important;
}

a {
  color: #60a5fa !important;
}

/* ── Container backgrounds ── */
div {
  background-color: transparent !important;
}

/* ── Table styling ── */
table {
  border-color: #2a2a2a !important;
  background: transparent !important;
}

thead {
  background: #1a1a1a !important;
}

thead th,
thead td {
  background: #1a1a1a !important;
  color: #ffffff !important;
  border-color: #2a2a2a !important;
}

tbody tr {
  border-color: #2a2a2a !important;
  background: transparent !important;
}

tbody td {
  color: #f1f5f9 !important;
  border-color: #2a2a2a !important;
  background: transparent !important;
}

tbody tr:hover td {
  background: rgba(255, 255, 255, 0.04) !important;
}

tfoot {
  background: #1a1a1a !important;
  border-color: #2a2a2a !important;
}

tfoot td,
tfoot th {
  border-color: #2a2a2a !important;
  color: #f1f5f9 !important;
}

th {
  color: #ffffff !important;
  border-color: #2a2a2a !important;
}

/* ── Form elements ── */
input {
  background: #1a1a1a !important;
  color: #f1f5f9 !important;
  border-color: #333 !important;
}

input::placeholder {
  color: #6b7280 !important;
}

textarea {
  background: #1a1a1a !important;
  color: #f1f5f9 !important;
  border-color: #333 !important;
}

select {
  background: #1a1a1a !important;
  color: #f1f5f9 !important;
  border-color: #333 !important;
}

option {
  background: #1a1a1a !important;
  color: #f1f5f9 !important;
}

/* ── Buttons ── */
button {
  background: #1e1e1e !important;
  color: #f1f5f9 !important;
  border-color: #333 !important;
}

button:hover {
  background: #252525 !important;
}

/* ── Primary/CTA buttons: keep vibrant (amber + dark text works in both themes) ── */
button[style*="f59e0b"],
button[style*="245, 158, 11"] {
  background-color: #f59e0b !important;
  color: #1e293b !important;
  border: none !important;
}
button[style*="f59e0b"]:hover,
button[style*="245, 158, 11"]:hover {
  background-color: #d97706 !important;
}
button[style*="3b82f6"],
button[style*="59, 130, 246"],
button[style*="007bff"] {
  background-color: #3b82f6 !important;
  color: #fff !important;
  border: none !important;
}
button[style*="3b82f6"]:hover,
button[style*="59, 130, 246"]:hover,
button[style*="007bff"]:hover {
  background-color: #2563eb !important;
}
button[style*="16a34a"],
button[style*="22c55e"] {
  background-color: #22c55e !important;
  color: #fff !important;
  border: none !important;
}
button[style*="16a34a"]:hover,
button[style*="22c55e"]:hover {
  background-color: #16a34a !important;
}
a[style*="f59e0b"],
a[style*="245, 158, 11"] {
  background-color: #f59e0b !important;
  color: #1e293b !important;
  border: none !important;
}
a[style*="f59e0b"]:hover,
a[style*="245, 158, 11"]:hover {
  background-color: #d97706 !important;
}

/* ── Borders ── */
hr {
  border-color: #2a2a2a !important;
}

/* ── SVG icons ── */
svg {
  color: #e2e8f0 !important;
}

svg path[stroke]:not([stroke="none"]) {
  stroke: #e2e8f0 !important;
}

/* ── Pre / code ── */
pre, code {
  background: #1a1a1a !important;
  color: #f1f5f9 !important;
}

/* ── Pagination ── */
nav {
  background: transparent !important;
}

/* ── Recharts / chart overrides ── */
.recharts-cartesian-grid line {
  stroke: #2a2a2a !important;
}

.recharts-cartesian-axis-tick text {
  fill: #6b7280 !important;
}

.recharts-cartesian-axis-line {
  stroke: #2a2a2a !important;
}

.recharts-tooltip-wrapper div {
  background: #1e1e1e !important;
  border-color: #333 !important;
  color: #f1f5f9 !important;
}

/* ── Scrollbar ── */
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15) !important;
}

::-webkit-scrollbar-track {
  background: transparent !important;
}

/* ── Modal overlays ── */
div[style*="position: fixed"],
div[style*="position:fixed"] {
  background: rgba(0, 0, 0, 0.6) !important;
}

/* ── Status badges keep their own colors but ensure border contrast ── */
span[style*="border-radius: 999px"] {
  border-color: rgba(255, 255, 255, 0.1) !important;
}

/* ── Skeleton loading pulse ── */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

const DARK_STYLE_ID = 'mjs-dark-override';

/**
 * Inject or remove dark-mode styles inside a shadow root.
 * Returns a cleanup function.
 */
export function applyDarkModeToShadow(shadowRoot: ShadowRoot | null, isDark: boolean): void {
  if (!shadowRoot) return;

  const existing = shadowRoot.getElementById(DARK_STYLE_ID);

  if (isDark && !existing) {
    const style = document.createElement('style');
    style.id = DARK_STYLE_ID;
    style.textContent = DARK_MODE_SHADOW_CSS;
    shadowRoot.prepend(style);
  } else if (!isDark && existing) {
    existing.remove();
  }
}

/**
 * Find the shadow root inside an MJS widget host element.
 * MJS creates a child div and attaches an open shadow root to it.
 */
export function getShadowRoot(hostEl: HTMLElement | null): ShadowRoot | null {
  if (!hostEl) return null;
  const shadowHost = hostEl.querySelector(':scope > div');
  return shadowHost?.shadowRoot ?? null;
}
