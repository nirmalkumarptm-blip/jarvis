// JARVIS brain: decides offline vs online, keeps session context, never fakes a feature.
import { detectLanguage } from './language.js';
import { matchIntent } from './intents.js';
import { reply } from './replies.js';
import { askOnline } from './online-provider.js';
import { isValidProxyUrl } from './settings.js';

const LOCALES = { ta: 'ta-IN', hi: 'hi-IN', tg: 'en-IN', hg: 'en-IN', en: 'en-IN' };

export function createBrain(env) {
  const history = []; // { role, content, lang, source, ts }  (in memory for Milestone 1)
  const nowMs = () => (env.now ? env.now() : Date.now());

  async function offlineAnswer(name, lang) {
    const d = new Date(nowMs());
    switch (name) {
      case 'time': {
        const t = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
        return reply('time', lang, t);
      }
      case 'date': {
        const s = d.toLocaleDateString(LOCALES[lang] || 'en-IN', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
        return reply('date', lang, s);
      }
      case 'battery': {
        const b = env.getBattery ? await env.getBattery() : null;
        if (!b) return reply('batteryUnavailable', lang);
        return reply('battery', lang, Math.round(b.level * 100), b.charging);
      }
      default:
        return reply(name, lang);
    }
  }

  async function viaOnline(lang) {
    if (!env.isOnline()) return { text: reply('needInternet', lang), source: 'system' };
    const url = env.getProxyUrl ? env.getProxyUrl() : '';
    if (!url || !isValidProxyUrl(url)) return { text: reply('onlineNotSetup', lang), source: 'system' };
    try {
      const messages = history.slice(-20).map(({ role, content }) => ({ role, content }));
      const text = await askOnline({ url, messages, lang, fetchImpl: env.fetchImpl });
      return { text, source: 'online' };
    } catch {
      return { text: reply('onlineFailed', lang), source: 'system' };
    }
  }

  async function route(text, lang) {
    const intent = matchIntent(text);
    if (intent && intent.type === 'offline') {
      return { text: await offlineAnswer(intent.name, lang), source: 'offline', intent: intent.name };
    }
    if (intent && intent.type === 'device') {
      return { text: reply('notYet', lang, intent.label), source: 'system', intent: intent.name };
    }
    const r = await viaOnline(lang);
    return { ...r, intent: intent ? intent.name : null };
  }

  async function handle(input) {
    const text = String(input).trim();
    if (!text) return null;
    const lang = detectLanguage(text);
    history.push({ role: 'user', content: text, lang, ts: nowMs() });
    let result;
    try {
      result = await route(text, lang);
    } catch {
      result = { text: reply('onlineFailed', lang), source: 'system' };
    }
    history.push({ role: 'assistant', content: result.text, lang, source: result.source, ts: nowMs() });
    return { ...result, lang };
  }

  return {
    handle,
    getHistory: () => history.slice(),
    clear: () => { history.length = 0; },
  };
}
