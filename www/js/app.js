// UI controller: wires the home screen to the brain. No voice or AI is faked here.
import { createBrain } from './core/brain.js';
import { loadSettings, saveSettings, isValidProxyUrl } from './core/settings.js';
import { initReactor, setReactorState, previewSequence, cancelPreview } from './ui/reactor.js';
import { setVoiceMode, runVoiceDemo } from './ui/voice-panel.js';

const $ = (id) => document.getElementById(id);
const SOURCE = {
  offline: { label: 'On-device', cls: 'src-offline' },
  online: { label: 'Online AI', cls: 'src-online' },
  system: { label: 'System', cls: 'src-system' },
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let prefs = loadSettings();
let busy = false;
let activeSheet = null;
let lastTrigger = null;
let clearTimer = null;

const brain = createBrain({
  isOnline: () => navigator.onLine,
  getProxyUrl: () => loadSettings().proxyUrl,
  getBattery: async () => {
    if (!navigator.getBattery) return null;
    try {
      const b = await navigator.getBattery();
      return { level: b.level, charging: b.charging };
    } catch {
      return null;
    }
  },
  now: () => Date.now(),
  fetchImpl: (...args) => fetch(...args),
});

/* ---------- small helpers ---------- */
const timeOf = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text; // textContent only: AI text can never inject HTML
  return n;
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2800);
}

function haptic() {
  if (prefs.haptics && navigator.vibrate) navigator.vibrate(8);
}

function applyPrefs() {
  document.documentElement.dataset.lowfx = String(!!prefs.lowFx);
  $('swHaptics').setAttribute('aria-checked', String(!!prefs.haptics));
  $('swLowFx').setAttribute('aria-checked', String(!!prefs.lowFx));
}

function updateProxyState() {
  $('proxyState').textContent = prefs.proxyUrl
    ? 'Configured. Online questions will go through your proxy.'
    : 'Not configured. JARVIS answers supported commands on-device only.';
}

/* ---------- touch feedback ---------- */
document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.btn');
  if (!b || b.disabled) return;
  haptic();
  const rect = b.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const r = el('span', 'rpl');
  r.style.width = r.style.height = size + 'px';
  r.style.left = e.clientX - rect.left - size / 2 + 'px';
  r.style.top = e.clientY - rect.top - size / 2 + 'px';
  r.addEventListener('animationend', () => r.remove());
  b.appendChild(r);
});

/* ---------- connection status ---------- */
let firstNet = true;
function updateNet() {
  const on = navigator.onLine;
  $('netStatus').dataset.online = String(on);
  $('netLabel').textContent = on ? 'Online' : 'Offline';
  if (!firstNet) toast(on ? 'Back online.' : "You're offline. On-device commands still work.");
  firstNet = false;
}

/* ---------- sheets (dialogs) ---------- */
function openSheet(id) {
  if (activeSheet) return;
  activeSheet = $(id);
  lastTrigger = document.activeElement;
  activeSheet.inert = false;
  activeSheet.classList.add('open');
  $('app').inert = true;
  history.pushState({ sheet: id }, '');
  activeSheet.querySelector('.sheet-panel').focus({ preventScroll: true });
}

function closeSheet() {
  if (!activeSheet) return;
  activeSheet.classList.remove('open');
  activeSheet.inert = true;
  $('app').inert = false;
  activeSheet = null;
  resetClearButton();
  if (lastTrigger && lastTrigger.focus) lastTrigger.focus({ preventScroll: true });
}

window.addEventListener('popstate', closeSheet);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && activeSheet) history.back(); });
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => history.back()));
document.querySelectorAll('.sheet').forEach((s) =>
  s.addEventListener('click', (e) => { if (e.target === s) history.back(); })
);

/* ---------- chat rendering ---------- */
function setChatting(on) {
  $('app').dataset.chat = String(on);
  $('hero').hidden = on;
}

function scrollChat() {
  const s = $('chatScroll');
  s.scrollTo({ top: s.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function addUser(text, ts) {
  const m = el('article', 'msg user');
  const bubble = el('div', 'bubble');
  bubble.appendChild(el('p', '', text));
  m.append(bubble, el('time', '', timeOf(ts)));
  $('chatScroll').appendChild(m);
  scrollChat();
}

function addJarvis(text, source, ts) {
  const src = SOURCE[source] || SOURCE.system;
  const m = el('article', 'msg jarvis');
  const bubble = el('div', 'bubble');
  const head = el('div', 'bh');
  head.append(el('span', 'who', 'JARVIS'), el('span', 'tag src ' + src.cls, src.label));
  const foot = el('div', 'bf');
  const copy = el('button', 'btn mini', 'Copy');
  copy.type = 'button';
  copy.setAttribute('aria-label', 'Copy reply');
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Reply copied');
    } catch {
      toast('Could not copy on this device');
    }
  });
  foot.append(el('time', '', timeOf(ts)), copy);
  bubble.append(head, el('p', '', text), foot);
  m.appendChild(bubble);
  $('chatScroll').appendChild(m);
  scrollChat();
}

function addTyping() {
  const m = el('article', 'msg jarvis typing');
  m.setAttribute('aria-hidden', 'true');
  const bubble = el('div', 'bubble');
  const dots = el('div', 'dots');
  dots.append(el('i'), el('i'), el('i'));
  bubble.appendChild(dots);
  m.appendChild(bubble);
  $('chatScroll').appendChild(m);
  scrollChat();
  return m;
}

function updateSend() {
  $('btnSend').disabled = busy || !$('cmd').value.trim();
}

async function send(raw) {
  const text = String(raw).trim();
  if (busy || !text) return;
  busy = true;
  cancelPreview();
  setChatting(true);
  addUser(text, Date.now());
  const typing = addTyping();
  setReactorState('thinking');
  updateSend();
  try {
    // Short settle time so instant on-device answers still show the thinking state.
    const [r] = await Promise.all([brain.handle(text), sleep(280)]);
    typing.remove();
    addJarvis(r.text, r.source, Date.now());
  } catch {
    typing.remove();
    addJarvis('Something went wrong on my side. Please try again.', 'system', Date.now());
  } finally {
    setReactorState('idle'); // Milestone 3 will switch to 'speaking' while the voice talks
    busy = false;
    updateSend();
  }
}

/* ---------- history sheet ---------- */
function renderHistory() {
  const list = $('historyList');
  list.replaceChildren();
  const items = brain.getHistory();
  $('hCount').textContent = items.length
    ? `${items.length} message${items.length === 1 ? '' : 's'} · stored in memory for this session only`
    : 'Stored in memory for this session only';
  $('btnClear').hidden = !items.length;
  if (!items.length) {
    list.appendChild(el('div', 'empty', 'No conversation yet.'));
    return;
  }
  for (const m of items) {
    const isUser = m.role === 'user';
    const row = el(isUser ? 'button' : 'div', 'vrow ' + (isUser ? 'user btn' : 'jarvis'));
    if (isUser) {
      row.type = 'button';
      row.setAttribute('aria-label', 'Reuse command: ' + m.content);
    }
    const meta = el('div', 'vmeta');
    meta.append(el('span', '', (isUser ? 'You' : 'JARVIS') + ' · ' + timeOf(m.ts)));
    if (!isUser && SOURCE[m.source]) meta.append(el('span', 'tag src ' + SOURCE[m.source].cls, SOURCE[m.source].label));
    const body = el('div', 'vbody');
    body.append(meta, el('div', 'vtext', m.content));
    row.append(el('span', 'vicon', isUser ? 'Y' : 'J'), body);
    if (isUser) {
      row.addEventListener('click', () => {
        $('cmd').value = m.content;
        updateSend();
        history.back();
        setTimeout(() => $('cmd').focus(), 50);
      });
    }
    list.appendChild(row);
  }
}

function resetClearButton() {
  clearTimeout(clearTimer);
  $('btnClear').classList.remove('confirm');
  $('btnClear').textContent = 'Delete conversation history';
}

$('btnClear').addEventListener('click', () => {
  const btn = $('btnClear');
  if (!btn.classList.contains('confirm')) {
    btn.classList.add('confirm');
    btn.textContent = 'Tap again to permanently delete';
    clearTimer = setTimeout(resetClearButton, 3500);
    return;
  }
  resetClearButton();
  brain.clear();
  $('chatScroll').querySelectorAll('.msg').forEach((n) => n.remove());
  setChatting(false);
  renderHistory();
  toast('Conversation history deleted');
});

/* ---------- settings sheet ---------- */
$('btnSaveSettings').addEventListener('click', () => {
  const url = $('proxyUrl').value.trim();
  if (!isValidProxyUrl(url)) { toast('URL must start with https://'); return; }
  const next = { ...loadSettings(), proxyUrl: url };
  if (saveSettings(next)) {
    prefs = next;
    updateProxyState();
    toast('Settings saved');
  } else {
    toast('Could not save settings');
  }
});

function bindSwitch(id, key) {
  $(id).addEventListener('click', () => {
    prefs = { ...prefs, [key]: !prefs[key] };
    saveSettings({ ...loadSettings(), [key]: prefs[key] });
    applyPrefs();
  });
}
bindSwitch('swHaptics', 'haptics');
bindSwitch('swLowFx', 'lowFx');

document.querySelectorAll('[data-preview]').forEach((b) =>
  b.addEventListener('click', () => {
    history.back(); // close settings so the reactor is visible
    previewSequence([b.dataset.preview], 4000);
  })
);

/* ---------- main wiring ---------- */
$('btnHistory').addEventListener('click', () => { renderHistory(); openSheet('sheetHistory'); });
$('btnSettings').addEventListener('click', () => {
  $('proxyUrl').value = prefs.proxyUrl;
  updateProxyState();
  openSheet('sheetSettings');
});

$('composer').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('cmd').value;
  $('cmd').value = '';
  updateSend();
  send(text);
});
$('cmd').addEventListener('input', updateSend);

document.querySelectorAll('[data-suggest]').forEach((b) =>
  b.addEventListener('click', () => send(b.dataset.suggest))
);

$('btnMic').addEventListener('click', () => setVoiceMode(true));
$('btnKeyboard').addEventListener('click', () => setVoiceMode(false));
$('btnDemo').addEventListener('click', runVoiceDemo);
$('btnOrb').addEventListener('click', () => toast('Microphone is not available yet. Voice arrives in Milestone 3.'));

/* ---------- start ---------- */
(function greet() {
  const h = new Date().getHours();
  const g = h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 17 ? 'Good afternoon' : h >= 17 && h < 22 ? 'Good evening' : 'Hello';
  $('heroGreeting').textContent = g + '.';
})();
initReactor();
applyPrefs();
updateNet();
window.addEventListener('online', updateNet);
window.addEventListener('offline', updateNet);
