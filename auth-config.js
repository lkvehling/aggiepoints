<!-- auth-config.js -->
<script>
  // ====== REPLACE THESE TWO ======
  const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
  const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
  // ===============================

  const APP_HOME = "index.html";
  const LOGIN_PAGE = "login.html";

  // Supabase client for all pages
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Small UI helpers
  function setDisabled(el, disabled) { if (el) el.disabled = disabled; }
  function show(el, text, ok=false) { if (el) { el.textContent = text; el.style.color = ok ? "green" : "red"; } }
  function clear(el) { if (el) el.textContent = ""; }

  // Auth guards
  async function redirectIfLoggedIn() {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user) window.location.href = APP_HOME;
  }
  async function requireSessionOrRedirect() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.user) window.location.href = LOGIN_PAGE;
    return session?.user ?? null;
  }
</script>
