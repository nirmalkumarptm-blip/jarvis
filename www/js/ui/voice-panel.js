import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { previewSequence, stopPreview } from './reactor.js';

const $ = (id) => document.getElementById(id);

const VOICE_LOCALES = {
  ta: 'ta-IN',
  hi: 'hi-IN',
  tg: 'en-IN',
  hg: 'en-IN',
  en: 'en-IN'
};

export function setVoiceMode(on) {
  $('app').dataset.mode = on ? 'voice' : 'text';
  $('composer').hidden = on;
  $('voiceDock').hidden = !on;

  if (!on) {
    stopPreview();
  }

  (on ? $('btnKeyboard') : $('cmd')).focus({
    preventScroll: true
  });
}

// Start real microphone speech recognition.
export async function startListening(lang = 'en') {
  const available = await SpeechRecognition.available();

  if (!available.available) {
    throw new Error('Speech recognition is not available on this device.');
  }

  let permission = await SpeechRecognition.checkPermissions();

  if (permission.speechRecognition !== 'granted') {
    permission = await SpeechRecognition.requestPermissions();
  }

  if (permission.speechRecognition !== 'granted') {
    throw new Error('Microphone permission was not granted.');
  }

  const result = await SpeechRecognition.start({
    language: VOICE_LOCALES[lang] || 'en-IN',
    maxResults: 1,
    partialResults: false,
    popup: false
  });

  const transcript = result.matches?.[0]?.trim();

  if (!transcript) {
    throw new Error('No speech was recognized. Please try again.');
  }

  return transcript;
}

export async function stopListening() {
  try {
    const state = await SpeechRecognition.isListening();

    if (state.listening) {
      await SpeechRecognition.stop();
    }
  } catch {
    // Ignore if recognition has already stopped.
  }
}

// Speak JARVIS reply using the phone's installed TTS voice.
export async function speakReply(text, lang = 'en') {
  const content = String(text || '').trim();

  if (!content) return;

  await TextToSpeech.speak({
    text: content,
    lang: VOICE_LOCALES[lang] || 'en-IN',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  });
}

export async function stopSpeaking() {
  try {
    await TextToSpeech.stop();
  } catch {
    // Ignore if TTS is not speaking.
  }
}

export function runVoiceDemo() {
  previewSequence(['listening', 'speaking'], 2500);
}
