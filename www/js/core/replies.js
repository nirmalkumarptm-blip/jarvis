// All canned (offline) replies in 5 language modes: en, ta, tg (Thanglish), hi, hg (Hinglish).
const T = {
  greeting: {
    en: 'Hello! JARVIS online. How can I help?',
    ta: 'வணக்கம்! நான் JARVIS. எப்படி உதவலாம்?',
    tg: 'Vanakkam! Naan JARVIS. Eppadi help pannalam?',
    hi: 'नमस्ते! JARVIS हाज़िर है। क्या मदद चाहिए?',
    hg: 'Namaste! JARVIS hazir hai. Kya madad chahiye?',
  },
  howAreYou: {
    en: "I'm doing great, thanks for asking. How are you?",
    ta: 'நான் நன்றாக இருக்கிறேன். நீங்கள் எப்படி இருக்கிறீர்கள்?',
    tg: 'Naan nalla irukken. Neenga eppadi irukeenga?',
    hi: 'मैं बिल्कुल ठीक हूँ। आप कैसे हैं?',
    hg: 'Main bilkul theek hoon. Aap kaise hain?',
  },
  whoAmI: {
    en: "I'm JARVIS, your personal AI assistant. I'm in early development, so I can only do a few things so far.",
    ta: 'நான் JARVIS, உங்கள் தனிப்பட்ட AI உதவியாளர். இப்போது வளர்ச்சி நிலையில் இருக்கிறேன், அதனால் சில விஷயங்கள் மட்டுமே செய்ய முடியும்.',
    tg: 'Naan JARVIS, ungaloda personal AI assistant. Ippo early stage-la irukken, so konjam vishayam dhaan panna mudiyum.',
    hi: 'मैं JARVIS हूँ, आपका निजी AI असिस्टेंट। अभी शुरुआती चरण में हूँ, इसलिए सीमित काम ही हो पाएँगे।',
    hg: 'Main JARVIS, aapka personal AI assistant. Abhi shuruaati stage mein hoon, isliye limited kaam hi ho paayenge.',
  },
  thanks: {
    en: "You're welcome!",
    ta: 'நன்றி! எப்போது வேண்டுமானாலும் கேளுங்கள்.',
    tg: 'Welcome! Eppo venumnaalum kelunga.',
    hi: 'आपका स्वागत है!',
    hg: 'Aapka swagat hai!',
  },
  time: {
    en: (t) => `It's ${t}.`,
    ta: (t) => `இப்போது நேரம் ${t}.`,
    tg: (t) => `Ippo time ${t}.`,
    hi: (t) => `अभी समय ${t} है।`,
    hg: (t) => `Abhi time ${t} hai.`,
  },
  date: {
    en: (d) => `Today is ${d}.`,
    ta: (d) => `இன்று ${d}.`,
    tg: (d) => `Innaiku ${d}.`,
    hi: (d) => `आज ${d} है।`,
    hg: (d) => `Aaj ${d} hai.`,
  },
  battery: {
    en: (p, c) => `Battery is at ${p}%${c ? ' and charging' : ''}.`,
    ta: (p, c) => `பேட்டரி ${p}%${c ? ', சார்ஜ் ஆகிறது' : ''}.`,
    tg: (p, c) => `Battery ${p}%${c ? ', charge aagudhu' : ''}.`,
    hi: (p, c) => `बैटरी ${p}% है${c ? ' और चार्ज हो रही है' : ''}।`,
    hg: (p, c) => `Battery ${p}% hai${c ? ' aur charge ho rahi hai' : ''}.`,
  },
  batteryUnavailable: {
    en: "I can't read the battery level on this device right now.",
    ta: 'இப்போது இந்த சாதனத்தில் பேட்டரி அளவைப் படிக்க முடியவில்லை.',
    tg: 'Ippo indha device-la battery level padikka mudiyala.',
    hi: 'अभी इस डिवाइस पर बैटरी स्तर पढ़ नहीं पा रहा।',
    hg: 'Abhi is device par battery level padh nahi pa raha.',
  },
  notYet: {
    en: (f) => `${f} control isn't built yet. It's planned for Milestone 4, and I won't pretend otherwise.`,
    ta: (f) => `${f} கட்டுப்பாடு இன்னும் உருவாக்கப்படவில்லை. இது Milestone 4-ல் வரும்.`,
    tg: (f) => `${f} control innum build aagala. Milestone 4-la varum.`,
    hi: (f) => `${f} कंट्रोल अभी बना नहीं है। यह Milestone 4 में आएगा।`,
    hg: (f) => `${f} control abhi bana nahi hai. Yeh Milestone 4 mein aayega.`,
  },
  needInternet: {
    en: "That needs an internet connection, and you're offline right now. I can still tell you the time, date and battery.",
    ta: 'இதற்கு இணைய இணைப்பு தேவை, இப்போது நீங்கள் ஆஃப்லைனில் இருக்கிறீர்கள். நேரம், தேதி, பேட்டரி போன்றவற்றை சொல்ல முடியும்.',
    tg: 'Idhukku internet venum, ippo offline-la irukeenga. Time, date, battery madhiri vishayangal sollalam.',
    hi: 'इसके लिए इंटरनेट चाहिए और अभी आप ऑफ़लाइन हैं। समय, तारीख और बैटरी की जानकारी अभी भी मिल सकती है।',
    hg: 'Iske liye internet chahiye aur abhi aap offline hain. Time, date aur battery ki jaankari abhi bhi mil sakti hai.',
  },
  onlineNotSetup: {
    en: "Online AI isn't connected yet. Add your AI proxy URL in Settings (we build the proxy in Milestone 2).",
    ta: 'ஆன்லைன் AI இன்னும் இணைக்கப்படவில்லை. Settings-ல் proxy URL சேர்க்கவும் (Milestone 2-ல் உருவாக்குவோம்).',
    tg: 'Online AI innum connect aagala. Settings-la proxy URL add pannunga (Milestone 2-la build pannuvom).',
    hi: 'ऑनलाइन AI अभी जुड़ा नहीं है। Settings में proxy URL जोड़ें (Milestone 2 में बनाएँगे)।',
    hg: 'Online AI abhi connect nahi hai. Settings mein proxy URL add karein (Milestone 2 mein banayenge).',
  },
  onlineFailed: {
    en: "I couldn't reach the AI service just now. Please try again.",
    ta: 'AI சேவையை இப்போது அணுக முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    tg: 'AI service-ah ippo reach panna mudiyala. Marubadiyum try pannunga.',
    hi: 'AI सेवा से अभी संपर्क नहीं हो सका। कृपया फिर कोशिश करें।',
    hg: 'AI service se abhi connect nahi ho paya. Please dobara try karein.',
  },
};

export function reply(key, lang = 'en', ...args) {
  const entry = T[key];
  const v = (entry && (entry[lang] || entry.en)) || '';
  return typeof v === 'function' ? v(...args) : v;
}
