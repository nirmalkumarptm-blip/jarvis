// Offline intent matcher. Keyword/regex based, tolerant of Tamil, Thanglish, English, Hindi.
// Each intent has a `type`:
//   'offline' -> answered on-device right now
//   'device'  -> needs Android integration (Milestone 4) - we say so honestly
//   'online'  -> needs the internet AI
import { normalize } from './language.js';

const INTENTS = [
  // ---- device actions (Milestone 4) ----
  { name: 'alarm', type: 'device', label: 'Alarm', re: /\b(alarm|wake ?up|wakeup)\b|அலாரம்|अलार्म/ },
  { name: 'reminder', type: 'device', label: 'Reminder', re: /\b(remind|reminder|remainder)\b|நினைவூட்டு|रिमाइंडर/ },
  { name: 'flashlight', type: 'device', label: 'Flashlight', re: /flash ?light|\btorch\b|\btochu\b|டார்ச்|टॉर्च/ },
  { name: 'bluetooth', type: 'device', label: 'Bluetooth', re: /blue ?tooth|ப்ளூடூத்|ब्लूटूथ/ },
  { name: 'wifi', type: 'device', label: 'Wi-Fi', re: /\bwi ?fi\b|வைஃபை|वाईफाई/ },
  { name: 'volume', type: 'device', label: 'Volume', re: /\bvolume\b|\bvol (up|down)\b|ஒலி அளவு|वॉल्यूम/ },
  { name: 'calendar', type: 'device', label: 'Calendar', re: /\b(calendar|appointment)\b|कैलेंडर|நாட்காட்டி/ },
  { name: 'contacts', type: 'device', label: 'Contacts', re: /\bcontacts?\b|தொடர்புகள்|कॉन्टैक्ट/ },
  { name: 'sms', type: 'device', label: 'SMS', re: /\b(sms|messages?|msg)\b|மெசேஜ்|मैसेज/ },
  { name: 'call', type: 'device', label: 'Phone call', re: /\b(call|calling|dial)\b|கால்|कॉल/ },
  { name: 'openApp', type: 'device', label: 'App launching', re: /\b(open|launch)\b|திற\b|खोलो/ },

  // ---- needs internet ----
  { name: 'weather', type: 'online', re: /weather|temperature|\brain\b|mazhai|mausam|வானிலை|மழை|मौसम/ },

  // ---- offline answers ----
  { name: 'battery', type: 'offline', re: /\b(battery|charge|charging)\b|பேட்டரி|बैटरी/ },
  { name: 'time', type: 'offline', re: /\b(time|samay|neram)\b|நேரம்|மணி என்ன|समय|टाइम/ },
  { name: 'date', type: 'offline', re: /\b(date|tarikh|tareekh|today s date)\b|தேதி|तारीख/ },
  { name: 'howAreYou', type: 'offline', re: /enna pan(r|d)(a|inga|ringa|ra)|how are you|(epdi|eppadi) (iruka|irukka|irukeenga|irukinga|irukingala)|kaise ho|kya haal|aap kaise|நலமா|எப்படி இருக்க|कैसे हो|कैसे हैं/ },
  { name: 'whoAmI', type: 'offline', re: /who are you|your name|nee yaar|nee yar|aap kaun|tum kaun|நீ யார்|तुम कौन|आप कौन/ },
  { name: 'thanks', type: 'offline', re: /\b(thanks|thank you|nandri|shukriya|dhanyavad)\b|நன்றி|धन्यवाद|शुक्रिया/ },
  { name: 'greeting', type: 'offline', maxWords: 3, re: /^(hi|hello|hey|vanakkam|namaste|namaskar)\b|வணக்கம்|नमस्ते|नमस्कार/ },
];

export function matchIntent(rawText) {
  let t = normalize(rawText);
  const hadWakeWord = /^(hey |hi |ok |okay )?jarvis\b/.test(t);
  t = t.replace(/^(hey |hi |ok |okay )?jarvis\b\s*/, '');
  if (!t) return hadWakeWord ? { name: 'greeting', type: 'offline' } : null;

  const wordCount = t.split(' ').length;
  for (const intent of INTENTS) {
    if (intent.maxWords && wordCount > intent.maxWords) continue;
    if (intent.re.test(t)) return intent;
  }
  return null;
}
