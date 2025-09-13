<!-- auth-config.js -->
<script>
// ====== REPLACE THESE TWO IF THEY CHANGE ======
const SUPABASE_URL = "https://gtnptxnkminqmjnnfxie.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bnB0eG5rbWlucW1qbm5meGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NzA0NTEsImV4cCI6MjA3MjQ0NjQ1MX0.LkEbFzHkyBVjxEFgAm_KL30buEkkkoMPsBMUeNyRGow";
// ==============================================

const APP_HOME   = "index.html";
const LOGIN_PAGE = "login.html";

/* ---------- Storage probe (iOS private / blocked storage safe) ---------- */
let authStorage = {
  getItem: (k) => window.localStorage.getItem(k),
  setItem: (k, v) => window.localStorage.setItem(k, v),
  removeItem: (k) => window.localStorage.removeItem(k),
};
try {
  const probe = "__storage_probe__";
  window.localStorage.setItem(probe, "1");
  window.localStorage.removeItem(probe);
} catch {
  // Fallback to in-memory storage for this tab/session
  const mem = new Map();
  authStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
  console.warn("[Auth] Using in-memory storage (localStorage unavailable).");
}

/* ---------- Supabase client (shared across all pages) ---------- */
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
});
window.sb = _sb; // expose globally for page scripts

/* ---------- Small UI helpers (yours, kept) ---------- */
function setDisabled(el, disabled) { if (el) el.disabled = disabled; }
function show(el, text, ok=false) { if (el) { el.textContent = text; el.style.color = ok ? "green" : "red"; } }
function clear(el) { if (el) el.textContent = ""; }
window.setDisabled = setDisabled;
window.show = show;
window.clear = clear;

/* ---------- Auth guards (yours, kept) ---------- */
async function redirectIfLoggedIn() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) window.location.href = APP_HOME;
}
async function requireSessionOrRedirect() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session?.user) window.location.href = LOGIN_PAGE;
  return session?.user ?? null;
}
window.redirectIfLoggedIn = redirectIfLoggedIn;
window.requireSessionOrRedirect = requireSessionOrRedirect;

/* ---------- Shared: ensure auth state is reflected in the UI ---------- */
async function ensureAuthUI() {
  try {
    const { data: { session } } = await sb.auth.getSession();
    // Set a simple flag other code/CSS can read
    document.documentElement.dataset.signedIn = session?.user ? "true" : "false";

    // Optional: if pages expose hooks, call them when user is known
    // e.g., window.onAuthReady?.(session);  // implement per page if desired
  } catch (e) {
    console.error("ensureAuthUI failed:", e);
  }
}
window.ensureAuthUI = ensureAuthUI;

/* ---------- Logout wired for mobile (tap + click) ---------- */
async function handleLogout(ev) {
  ev?.preventDefault?.();
  try {
    await sb.auth.signOut();
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    window.location.href = LOGIN_PAGE;
  } catch (err) {
    console.error("Logout failed:", err);
    alert("Couldn’t log you out. Please try again.");
  }
}
function wireCommonUI() {
  // Logout button (present on pages that show it)
  const btn = document.getElementById("logoutBtn");
  if (btn) ["click","touchend"].forEach(evt =>
    btn.addEventListener(evt, handleLogout, { passive: true })
  );

  // Optional account menu toggle if you use these IDs
  const toggle = document.getElementById("accountToggle");
  const menu   = document.getElementById("accountMenu");
  if (toggle && menu) {
    const toggleMenu = (e) => { e?.preventDefault?.(); menu.classList.toggle("hidden"); };
    ["click","touchend"].forEach(evt => toggle.addEventListener(evt, toggleMenu, { passive:true }));
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) menu.classList.add("hidden");
    });
  }
}

/* ---------- Keep pages synced on auth events ---------- */
sb.auth.onAuthStateChange((_event, _session) => {
  // Events: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
  ensureAuthUI();
  // If a page defines hooks, call them here if you want:
  // window.onAuthChange?.(_event, _session);
});

/* ---------- Boot on each page ---------- */
document.addEventListener("DOMContentLoaded", () => {
  wireCommonUI();
  ensureAuthUI(); // reflect real auth before page code runs
});
</script>
