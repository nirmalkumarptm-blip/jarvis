// Voice-mode dock. In Milestone 1 there is NO speech engine: the orb is disabled and says so.
// Milestone 3 will enable the orb and drive the reactor from the real microphone state.
import { previewSequence, stopPreview } from './reactor.js';

const $ = (id) => document.getElementById(id);

export function setVoiceMode(on) {
  $('app').dataset.mode = on ? 'voice' : 'text';
  $('composer').hidden = on;
  $('voiceDock').hidden = !on;
  if (!on) stopPreview();
  (on ? $('btnKeyboard') : $('cmd')).focus({ preventScroll: true });
}

export function runVoiceDemo() {
  previewSequence(['listening', 'speaking'], 2500);
}
