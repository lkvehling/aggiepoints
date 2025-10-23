// checkin.js — shared check-in module with cross-page sync
// Requires: auth-config.js (global `sb`)
// ===== Global Pacific Time helpers (shared) =====
(function () {
  const PT_TZ = 'America/Los_Angeles';

  function formatPT(iso, opts = {}) {
    if (!iso) return '';
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: PT_TZ,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...opts
    }).format(d);
  }

  // Useful if you group by day in PT, e.g., "2025-10-06"
  function toPTDateKey(iso) {
    if (!iso) return '';
    return new Intl.DateTimeFormat('en-CA', { timeZone: PT_TZ }).format(new Date(iso));
  }

  // Optionally compute PT “today” bounds in UTC for client-side filtering
  function ptDayBoundsUTC(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: PT_TZ,
      year:'numeric', month:'2-digit', day:'2-digit'
    }).formatToParts(date);
    const y = parts.find(p=>p.type==='year').value;
    const m = parts.find(p=>p.type==='month').value;
    const d = parts.find(p=>p.type==='day').value;
    const startPT = new Date(`${y}-${m}-${d}T00:00:00-08:00`);
    const endPT   = new Date(`${y}-${m}-${d}T24:00:00-08:00`);
    return { startUTC: startPT.toISOString(), endUTC: endPT.toISOString() };
  }

  // Expose globally for any page script to use
  window.formatPT = formatPT;
  window.toPTDateKey = toPTDateKey;
  window.ptDayBoundsUTC = ptDayBoundsUTC;
})();

// Optional on page: window.toast(), window.showCheckinError(), window.refreshProfilePoints()

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function hasFn(name) { return typeof window[name] === 'function'; }
  function call(fnName, ...args) { if (hasFn(fnName)) try { return window[fnName](...args); } catch {} }

  // --- Cross-page channel + helpers ---
  const chan = ('BroadcastChannel' in window) ? new BroadcastChannel('aggie-checkin') : null;
  const LS_KEY = 'aggie_checked_in_ids'; // JSON array of eventIds

  function getCheckedSet() {
    try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
    catch { return new Set(); }
  }
  function addChecked(eventId) {
    const set = getCheckedSet();
    set.add(eventId);
    localStorage.setItem(LS_KEY, JSON.stringify([...set]));
  }

  // Mark any button for eventId as "Checked in"
  // checkin.js — REPLACE markCheckedInUI with this:
  function markCheckedInUI(eventId) {
    // Preferred: replace explicit slot (works even if the page rendered a gray label)
    document.querySelectorAll(`.checkin-slot[data-event-id="${eventId}"]`).forEach(slot => {
      slot.innerHTML = `<span class="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-ui text-sm">Checked in</span>`;
    });
  
    // Back-compat: also replace any button if present
    document.querySelectorAll(`.checkin-btn[data-event-id="${eventId}"]`).forEach(btn => {
      btn.outerHTML = `<span class="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-ui text-sm">Checked in</span>`;
    });
  }


  // Public: scan page and mark already-checked events based on localStorage
  function syncCheckedInUI() {
    const set = getCheckedSet();
    $$('.checkin-btn[data-event-id]').forEach(btn => {
      const id = btn.getAttribute('data-event-id');
      if (set.has(id)) {
        btn.outerHTML = `<span class="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-ui text-sm">Checked in</span>`;
      }
    });
  }

  // Listen for cross-tab messages
  if (chan) {
    chan.onmessage = (evt) => {
      const { type, eventId } = evt.data || {};
      if (type === 'checked_in' && eventId) {
        addChecked(eventId);   // ensure local cache is consistent
        markCheckedInUI(eventId);
        call('refreshProfilePoints');
      }
    };
  }

  // Fallback: listen to storage events (when other tab writes)
  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) syncCheckedInUI();
  });

  // --- Toast fallbacks ---
  function fallbackToast(msg) { alert(msg); }
  function showToast(message, opts = {}) { return hasFn('toast') ? window.toast(message, opts) : fallbackToast(message); }
  function mapError(err) {
    if (hasFn('showCheckinError')) return window.showCheckinError(err);
    const code = err?.code, details = err?.details || err?.message || '';
    if (code === '23505' || /duplicate/i.test(details)) return 'You already checked in for this event.';
    if (code === '401' || /JWT|auth/i.test(details))    return 'You must be signed in to check in.';
    if (/geofence/i.test(details))                      return 'You must be at the venue to check in. If you are here, please close the tab, ensure precision location is on, move closer to center of event, and reopen Aggie Points.';
    if (/time/i.test(details))                          return 'This event is not currently active.';
    if (/accuracy/i.test(details))                      return 'Location accuracy is too low. Try again with GPS on.';
    return 'Check-in failed. Please try again.';
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject(new Error('Geolocation not available'));
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    });
  }

  async function handleClick(btn) {
    const eventId = btn.getAttribute('data-event-id');
    if (!eventId) { showToast('Check-in misconfigured (missing event id).', { variant: 'error' }); return; }

    const eventName   = btn.getAttribute('data-event-name');
    const eventPoints = btn.getAttribute('data-event-points');

    if (btn.disabled) return;
    btn.disabled = true;
    const original = btn.innerHTML;
    btn.innerHTML = `
      <span class="inline-flex items-center gap-2">
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity=".25"></circle>
          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"></path>
        </svg>
        Checking…
      </span>
    `;

    try {
      const pos = await getPosition();
      const { latitude, longitude, accuracy } = pos.coords;

      const { error } = await sb.rpc('checkin', {
        p_event_id: eventId,
        p_lat: latitude,
        p_lng: longitude,
        p_accuracy: accuracy
      });

      if (error) {
        btn.disabled = false;
        btn.innerHTML = original;
        showToast(mapError(error), { variant: 'error' });
        return;
      }

      // Success: update here
      btn.outerHTML = `<span class="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-ui text-sm">Checked in</span>`;
      showToast(
        eventName ? `Checked in to “${eventName}”${eventPoints ? ` — +${eventPoints} pts` : ''}! 🎉` : 'Checked in — have fun! 🎉',
        { variant: 'success', timeout: 2500 }
      );
      call('refreshProfilePoints');

      // Cross-page sync
      addChecked(eventId);
      if (chan) chan.postMessage({ type: 'checked_in', eventId });

    } catch (geoErr) {
      btn.disabled = false;
      btn.innerHTML = original;
      showToast('We need your location to check in. Please turn on location access ("Privacy & Security" > "Location Services") for your browser (Safari/Chrome) and try again!', { variant: 'error' });
    }
  }

  function initCheckinButtons() {
    $$('.checkin-btn[data-event-id]').forEach(btn => {
      if (btn.dataset.wired === '1') return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => handleClick(btn));
    });
    // After wiring, also sync any that are already checked in (e.g., from another tab)
    syncCheckedInUI();
  }

  // Expose for pages
  window.initCheckinButtons = initCheckinButtons;
  window.syncCheckedInUI = syncCheckedInUI;
})();
