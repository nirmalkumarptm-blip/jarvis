// Online AI client. The app NEVER holds an AI provider key.
// It talks to YOUR proxy (e.g. a free Cloudflare Worker, built in Milestone 2) which holds the key.
//
// Contract:
//   POST <proxyUrl>   body: { messages: [{role, content}], lang }
//   200 JSON          { reply: "text" }
export async function askOnline({ url, messages, lang, fetchImpl = fetch, timeoutMs = 20000 }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, lang }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Empty reply');
    return data.reply.trim();
  } finally {
    clearTimeout(timer);
  }
}
