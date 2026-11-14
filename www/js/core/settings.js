// Settings live only on this device (localStorage). No secrets are stored here:
// the AI provider key lives on YOUR proxy server (see README, Milestone 2).
const KEY = 'jarvis.settings.v1';
const DEFAULTS = { proxyUrl: '', haptics: true, lowFx: false };

export function loadSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

// Only https (or localhost for testing) is accepted: secure API communication.
export function isValidProxyUrl(url) {
  if (!url) return true; // empty = not configured
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === 'localhost');
  } catch {
    return false;
  }
}
