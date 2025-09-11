<!-- auth-config.js -->
<script>
  // ====== EDIT THESE THREE ONLY ======
  const SUPABASE_URL = "https://gtnptxnkminqmjnnfxie.supabase.co";
  const SUPABASE_ANON_KEY = "YOUR_ANON_KEY"; // keep anon only
  const APP_HOME = "index.html";  // where to go after login
  const LOGIN_PAGE = "login.html";
  const REGISTER_PAGE = "register.html";
  // ===================================

  // One client for all pages
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Small UI helpers
  function setDisabled(el, disabled) { if (el) el.disabled = disabled; }
  function show(el, text, ok=false) {
    if (!el) return;
    el.textContent = text || "";
    el.style.color = ok ? "green" : "red";
  }
  function clear(el) { if (el) el.textContent = ""; }

  // Optional: simple logger toggle
  const DEBUG = true;
  function log(...args) { if (DEBUG) console.log("[auth]", ...args); }

  // Session guard helpers
  async function redirectIfLoggedIn() {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) window.location.href = APP_HOME;
  }
  async function requireSessionOrRedirect() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) window.location.href = LOGIN_PAGE;
    return session?.user;
  }

  // Keep page updated if auth state changes (useful during dev)
  sb.auth.onAuthStateChange((_event, session) => {
    log("auth change:", _event, !!session);
  });
</script>
