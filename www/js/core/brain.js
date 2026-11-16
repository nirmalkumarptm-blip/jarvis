// JARVIS brain: decides offline vs online, keeps persistent conversation history.
import { detectLanguage } from './language.js';
import { matchIntent } from './intents.js';
import { reply } from './replies.js';
import { askOnline } from './online-provider.js';
import { isValidProxyUrl } from './settings.js';

const LOCALES = {
  ta: 'ta-IN',
  hi: 'hi-IN',
  tg: 'en-IN',
  hg: 'en-IN',
  en: 'en-IN'
};

const HISTORY_KEY = 'jarvis.conversation.history.v1';
const MAX_HISTORY = 100;
const ONLINE_CONTEXT_LIMIT = 20;

export function createBrain(env) {
  const history = [];
  const nowMs = () => (env.now ? env.now() : Date.now());

  // Access local storage safely.
  function getStorage() {
    try {
      if (env.storage) return env.storage;
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch {
      // Storage may be unavailable.
    }
    return null;
  }

  const storage = getStorage();

  // Restore saved conversation history.
  function loadHistory() {
    if (!storage) return;

    try {
      const saved = storage.getItem(HISTORY_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return;

      const valid = parsed.filter(item =>
        item &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.trim()
      );

      history.push(...valid.slice(-MAX_HISTORY));
    } catch {
      // Invalid or unavailable saved history.
      history.length = 0;
    }
  }

  // Save latest 100 messages on this device.
  function saveHistory() {
    if (!storage) return;

    try {
      storage.setItem(
        HISTORY_KEY,
        JSON.stringify(history.slice(-MAX_HISTORY))
      );
    } catch {
      // Keep working in RAM if saving fails.
    }
  }

  function addHistory(item) {
    history.push(item);

    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY);
    }

    saveHistory();
  }

  loadHistory();

  async function offlineAnswer(name, lang) {
    const d = new Date(nowMs());

    switch (name) {
      case 'time': {
        const t = d.toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).toUpperCase();

        return reply('time', lang, t);
      }

      case 'date': {
        const s = d.toLocaleDateString(
          LOCALES[lang] || 'en-IN',
          {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }
        );

        return reply('date', lang, s);
      }

      case 'battery': {
        const b = env.getBattery
          ? await env.getBattery()
          : null;

        if (!b) return reply('batteryUnavailable', lang);

        return reply(
          'battery',
          lang,
          Math.round(b.level * 100),
          b.charging
        );
      }

      default:
        return reply(name, lang);
    }
  }

  async function viaOnline(lang) {
    if (!env.isOnline()) {
      return {
        text: reply('needInternet', lang),
        source: 'system'
      };
    }

    const url = env.getProxyUrl
      ? env.getProxyUrl()
      : '';

    if (!url || !isValidProxyUrl(url)) {
      return {
        text: reply('onlineNotSetup', lang),
        source: 'system'
      };
    }

    try {
      const messages = history
        .slice(-ONLINE_CONTEXT_LIMIT)
        .map(({ role, content }) => ({ role, content }));

      const text = await askOnline({
        url,
        messages,
        lang,
        fetchImpl: env.fetchImpl
      });

      return { text, source: 'online' };
    } catch {
      return {
        text: reply('onlineFailed', lang),
        source: 'system'
      };
    }
  }

  async function route(text, lang) {
    const intent = matchIntent(text);

    if (intent && intent.type === 'offline') {
      return {
        text: await offlineAnswer(intent.name, lang),
        source: 'offline',
        intent: intent.name
      };
    }

    if (intent && intent.type === 'device') {
      return {
        text: reply('notYet', lang, intent.label),
        source: 'system',
        intent: intent.name
      };
    }

    const result = await viaOnline(lang);

    return {
      ...result,
      intent: intent ? intent.name : null
    };
  }

  async function handle(input) {
    const text = String(input).trim();
    if (!text) return null;

    const lang = detectLanguage(text);

    addHistory({
      role: 'user',
      content: text,
      lang,
      ts: nowMs()
    });

    let result;

    try {
      result = await route(text, lang);
    } catch {
      result = {
        text: reply('onlineFailed', lang),
        source: 'system'
      };
    }

    addHistory({
      role: 'assistant',
      content: result.text,
      lang,
      source: result.source,
      ts: nowMs()
    });

    return { ...result, lang };
  }

  function clear() {
    history.length = 0;

    if (storage) {
      try {
        storage.removeItem(HISTORY_KEY);
      } catch {
        // Continue even if storage cleanup fails.
      }
    }
  }

  return {
    handle,
    getHistory: () => history.slice(),
    clear
  };
}
