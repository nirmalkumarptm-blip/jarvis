// Arc Reactor controller. States: idle | listening | thinking | speaking
// Demo previews are always labelled "· DEMO" so they can never be mistaken for real voice activity.
const LABELS = { idle: 'STANDBY', listening: 'LISTENING', thinking: 'PROCESSING', speaking: 'SPEAKING' };
let timers = [];

export function initReactor() {
  const host = document.getElementById('bars');
  if (!host || host.childNodes.length) return;
  const COUNT = 48;
  for (let i = 0; i < COUNT; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'bw';
    wrap.style.transform = `rotate(${(i * 360) / COUNT + 180}deg)`;
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.setProperty('--d', (0.35 + Math.random() * 0.5).toFixed(2) + 's');
    bar.style.setProperty('--dl', (-Math.random() * 0.8).toFixed(2) + 's');
    wrap.appendChild(bar);
    host.appendChild(wrap);
  }
}

export function setReactorState(state, { demo = false } = {}) {
  const el = document.getElementById('reactor');
  const label = document.getElementById('stateLabel');
  if (!el || !LABELS[state]) return;
  el.dataset.state = state;
  label.textContent = LABELS[state] + (demo ? ' · DEMO' : '');
}

export function cancelPreview() {
  timers.forEach(clearTimeout);
  timers = [];
}

export function previewSequence(states, msEach = 2500) {
  cancelPreview();
  states.forEach((s, i) => timers.push(setTimeout(() => setReactorState(s, { demo: true }), i * msEach)));
  timers.push(setTimeout(() => setReactorState('idle'), states.length * msEach));
  setReactorState(states[0], { demo: true });
}

export function stopPreview() {
  cancelPreview();
  setReactorState('idle');
}
