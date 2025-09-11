<!-- auth-config.js -->
<script>
  // ====== EDIT THESE THREE ONLY ======
  const SUPABASE_URL = "https://gtnptxnkminqmjnnfxie.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bnB0eG5rbWlucW1qbm5meGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NzA0NTEsImV4cCI6MjA3MjQ0NjQ1MX0.LkEbFzHkyBVjxEFgAm_KL30buEkkkoMPsBMUeNyRGow"; // keep anon only
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
