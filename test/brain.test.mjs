import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrain } from '../www/js/core/brain.js';
import { detectLanguage } from '../www/js/core/language.js';

const FIXED = new Date('2026-11-13T15:45:00').getTime();
function make(over = {}) {
  return createBrain({
    isOnline: () => false,
    getProxyUrl: () => '',
    getBattery: async () => ({ level: 0.82, charging: true }),
    now: () => FIXED,
    fetchImpl: async () => { throw new Error('no network in test'); },
    ...over,
  });
}

test('language detection', () => {
  assert.equal(detectLanguage('Jarvis enna panra?'), 'tg');
  assert.equal(detectLanguage('Amma ku call pannu'), 'tg');
  assert.equal(detectLanguage('நேரம் என்ன'), 'ta');
  assert.equal(detectLanguage('aaj kya tarikh hai'), 'hg');
  assert.equal(detectLanguage('आज क्या तारीख है'), 'hi');
  assert.equal(detectLanguage('what time is it'), 'en');
});

test('offline basics', async () => {
  const b = make();
  assert.match((await b.handle('what time is it')).text, /3:45 PM/);
  assert.match((await b.handle('நேரம் என்ன')).text, /3:45 PM/);
  assert.match((await b.handle('Jarvis enna panra?')).text, /Naan nalla irukken/);
  assert.match((await b.handle('aaj kya tarikh hai')).text, /^Aaj .* hai\.$/);
  assert.match((await b.handle('battery kitna hai')).text, /82%.*charge ho rahi/);
  assert.match((await b.handle('hello')).text, /JARVIS online/);
  assert.match((await b.handle('Jarvis')).text, /JARVIS online/);
  assert.match((await b.handle('who are you')).text, /JARVIS/);
});

test('device commands are honest: not built yet', async () => {
  const b = make();
  for (const [cmd, label] of [
    ['Amma ku call pannu', 'Phone call'],
    ['Bluetooth on pannu', 'Bluetooth'],
    ['Enakku reminder set pannu', 'Reminder'],
    ['Tomorrow morning 7 manikku wake up pannu', 'Alarm'],
    ['turn on flashlight', 'Flashlight'],
  ]) {
    const r = await b.handle(cmd);
    assert.equal(r.source, 'system', cmd);
    assert.ok(r.text.includes(label), cmd + ' -> ' + r.text);
    assert.match(r.text, /Milestone 4/);
  }
});

test('online-only requests while offline never pretend', async () => {
  const b = make();
  const r = await b.handle('Innaiku weather eppadi irukku?');
  assert.equal(r.source, 'system');
  assert.equal(r.lang, 'tg');
  assert.match(r.text, /internet venum/);
});

test('online but proxy not configured', async () => {
  const b = make({ isOnline: () => true });
  const r = await b.handle('explain black holes');
  assert.match(r.text, /isn't connected yet/);
});

test('online with proxy returns AI reply and sends context', async () => {
  let sent;
  const b = make({
    isOnline: () => true,
    getProxyUrl: () => 'https://example.workers.dev',
    fetchImpl: async (url, opts) => {
      sent = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ reply: 'Black holes are...' }) };
    },
  });
  await b.handle('hello');
  const r = await b.handle('explain black holes');
  assert.equal(r.source, 'online');
  assert.equal(r.text, 'Black holes are...');
  assert.ok(sent.messages.length >= 3);
});

test('online failure is handled', async () => {
  const b = make({ isOnline: () => true, getProxyUrl: () => 'https://x.dev' });
  const r = await b.handle('explain black holes');
  assert.match(r.text, /couldn't reach/);
});

test('insecure proxy URL rejected; history can be cleared', async () => {
  const b = make({ isOnline: () => true, getProxyUrl: () => 'http://evil.example' });
  assert.match((await b.handle('tell me a story')).text, /isn't connected yet/);
  assert.ok(b.getHistory().length === 2);
  b.clear();
  assert.equal(b.getHistory().length, 0);
});
