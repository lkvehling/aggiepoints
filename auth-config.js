
  // ====== REPLACE THESE TWO ======
  const SUPABASE_URL = "https://gtnptxnkminqmjnnfxie.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bnB0eG5rbWlucW1qbm5meGllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NzA0NTEsImV4cCI6MjA3MjQ0NjQ1MX0.LkEbFzHkyBVjxEFgAm_KL30buEkkkoMPsBMUeNyRGow";
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
