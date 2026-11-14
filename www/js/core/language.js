// Lightweight language detection for replies.
// Returns: 'en' | 'ta' (Tamil script) | 'tg' (Thanglish) | 'hi' (Devanagari) | 'hg' (Hinglish)

export function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const THANGLISH = new Set([
  'enna', 'panra', 'pandra', 'pannu', 'panren', 'pannunga', 'pannuviya', 'irukku', 'iruka', 'irukken',
  'eppadi', 'epdi', 'innaiku', 'inniku', 'naalaiku', 'nalaiku', 'amma', 'appa', 'enakku', 'ennaku',
  'manikku', 'mani', 'sollu', 'solu', 'podu', 'venum', 'vendam', 'seri', 'nandri', 'neram', 'nee',
  'yaaru', 'vanakkam', 'thambi', 'anna', 'akka', 'kudu', 'paaru', 'edhu', 'enga', 'epo', 'ippo',
]);

const HINGLISH = new Set([
  'kya', 'hai', 'hain', 'aaj', 'batao', 'bata', 'karo', 'kaise', 'kaisa', 'kaisi', 'mujhe', 'nahi',
  'samay', 'tarikh', 'tareekh', 'mera', 'meri', 'aap', 'tum', 'kitna', 'kitni', 'hoon', 'namaste',
  'shukriya', 'dhanyavad', 'kaun', 'abhi', 'kal',
]);

export function detectLanguage(text) {
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  const words = normalize(text).split(' ');
  let tg = 0;
  let hg = 0;
  for (const w of words) {
    if (THANGLISH.has(w)) tg++;
    if (HINGLISH.has(w)) hg++;
  }
  if (tg === 0 && hg === 0) return 'en';
  return hg > tg ? 'hg' : 'tg';
}
