// checkin.js — shared check-in module for Home + Events
// Requires: auth-config.js (global `sb`), and optionally page helpers:
// - window.toast(message, { variant, timeout })
// - window.showCheckinError(err)
// - window.refreshProfilePoints()

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function hasFn(name) { return typeof window[name] === 'function'; }
  function call(fnName, ...args) { if (hasFn(fnName)) try { return window[fnName](...args); } catch(e) { console.warn(fnName, e);} }

  // Basic fallback to keep UX decent if page didn't define toast()
  function fallbackToast(msg) {
    alert(msg);
  }
  function showToast(message, opts = {}) {
    if (hasFn('toast')) return window.toast(message, opts);
    fallbackToast(message);
  }

  function mapError(err) {
    if (hasFn('showCheckinError')) return window.showCheckinError(err);
    const code = err?.code;
    const details = err?.details || err?.message || '';
    if (code === '23505' || /duplicate/i.test(details)) return 'You already checked in for this event.';
    if (code === '401' || /JWT|auth/i.test(details))    return 'You must be signed in to check in.';
    if (/geofence/i.test(details))                      return 'You must be at the venue to check in.';
    if (/time/i.test(details))                          return 'This event is not currently active.';
    if (/accuracy/i.test(details))                      return 'Location accuracy is too low. Try again outside with GPS on.';
    return 'Check-in failed. Please try again.';
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) return reject(new Error('Geolocation not available'));
      navigator.geolocation.getCurrentPosition(
        pos => resolve(pos),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  async function handleClick(btn) {
    const eventId = btn.getAttribute('data-event-id');
    if (!eventId) { showToast('Check-in misconfigured (missing event id).', { variant: 'error' }); return; }

    // Optional metadata for nicer success toast
    const eventName   = btn.getAttribute('data-event-name');
    const eventPoints = btn.getAttribute('data-event-points');

    // Button -> loading
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
      // Geolocation
      const pos = await getPosition();
      const { latitude, longitude, accuracy } = pos.coords;

      // RPC (matches your current backend)
      const { error } = await sb.rpc('checkin', {
        p_event_id: eventId,
        p_lat: latitude,
        p_lng: longitude,
        p_accuracy: accuracy
      });

      if (error) {
        btn.disabled = false;
        btn.innerHTML = original;
        const msg = mapError(error);
        showToast(msg, { variant: 'error' });
        return;
      }

      // Success UI
      btn.outerHTML = `<span class="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-ui text-sm">Checked in</span>`;
      const msg = eventName
        ? `Checked in to “${eventName}”${eventPoints ? ` — +${eventPoints} pts` : ''}! 🎉`
        : 'Checked in — have fun! 🎉';
      showToast(msg, { variant: 'success', timeout: 2500 });

      // Let page refresh points if it has a helper
      await call('refreshProfilePoints');
    } catch (geoErr) {
      btn.disabled = false;
      btn.innerHTML = original;
      showToast('We need your location to check in. Please allow location access (site must be HTTPS or localhost) and try again.', { variant: 'error' });
    }
  }

  function initCheckinButtons() {
    // Wire any .checkin-btn that isn't already wired
    $$('.checkin-btn[data-event-id]').forEach(btn => {
      if (btn.dataset.wired === '1') return;
      btn.dataset.wired = '1';
      btn.addEventListener('click', () => handleClick(btn));
    });
  }

  // Expose
  window.initCheckinButtons = initCheckinButtons;
})();
