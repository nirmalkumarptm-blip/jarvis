# JARVIS — Milestone 1 (UI v0.2)

Android app built with **Capacitor** (web UI inside a native Android shell).
You edit files in a browser on your phone; **GitHub Actions** builds the APK in the cloud.

## Folder structure
```
jarvis/
├─ package.json                 dependencies + `npm test`
├─ capacitor.config.json        app id/name, web folder
├─ .gitignore
├─ .github/workflows/build-apk.yml   cloud build -> signed APK (Releases page)
├─ scripts/keystore.sh          creates/decrypts the stable signing key
├─ scripts/signing.init.gradle  tells Gradle to sign with that key
├─ signing/jarvis.keystore.enc  (appears after first build) encrypted key
├─ test/brain.test.mjs          automated tests for the AI brain
└─ www/                         the app itself
   ├─ index.html                home screen layout
   ├─ css/jarvis.css            black + electric blue theme, Arc Reactor animation
   └─ js/
      ├─ app.js                 UI wiring (chat bubbles, sheets, settings, touch feedback)
      ├─ ui/reactor.js          Arc Reactor states (idle/listening/thinking/speaking)
      ├─ ui/voice-panel.js      voice-mode dock (honest: engine arrives in Milestone 3)
      └─ core/
         ├─ brain.js            router: offline engine vs online AI
         ├─ intents.js          command matching (Tamil/Thanglish/English/Hindi)
         ├─ language.js         language detection
         ├─ replies.js          replies in 5 language modes
         ├─ online-provider.js  talks to YOUR proxy (no API key in the app)
         └─ settings.js         on-device settings
```

## Stable signing key (do this BEFORE the next build)
Without it, every build is signed with a different temporary key, so Android refuses to update an installed JARVIS, and uninstalling deletes downloaded AI models and memory.
1. In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: `JARVIS_KEY_PASSPHRASE`. Value: a long passphrase you invent (20+ characters). Save it in your password manager. If you lose it you must create a new key and uninstall the app once.
3. Run the build. The first run creates the key, stores only an **encrypted** copy at `signing/jarvis.keystore.enc`, and commits it with the generated `android/` folder.
4. **One-time:** uninstall the old JARVIS (it was signed with a temporary key), then install the new APK.
5. Check: every build log prints a `SHA-256` certificate line. It must be identical across builds. If so, future APKs install over the top and keep your data.
The passphrase is never stored in the repo or in code. No passphrase set = the build still works, with a warning and the old temporary key.

## Setup from an Android phone only
1. Create a free account at github.com. Open it in Chrome and turn on **Desktop site** (menu ⋮).
2. Create a **new repository** named `jarvis` (Private is fine). Tick "Add a README".
3. Open the repo, press the `.` key (or change `github.com` to `github.dev` in the address) to open the browser code editor.
   *Phone tip: if `.` doesn't work, use the URL method.*
4. Create each file from the list above (right-click folder → New File; typing `www/js/core/brain.js` creates folders automatically). Paste the contents. Commit with the Source Control tab (✓ Commit, then Sync/Push) to branch **main**.
   - Faster alternative: GitHub Codespaces (github.com → Code → Codespaces). Upload `jarvis.zip` with Explorer → Upload, then run `unzip -o jarvis.zip` in the terminal, commit and push.
5. Go to the repo's **Actions** tab. The "Build JARVIS APK" workflow starts after your push (or press **Run workflow**). The first build takes ~5–8 minutes.
6. When it's green, open the repo's **Releases** → "JARVIS latest build" → download `app-debug.apk`.
7. Open the APK on your phone. Android will ask to allow "Install unknown apps" for your browser. Allow it once, install, open JARVIS.

If the build fails, open the failed run, copy the red error text and send it to me.

## UI v0.2 additions (test these too)
- [ ] Empty state: large reactor, time-based greeting, 5 tappable suggestions.
- [ ] After the first message the reactor shrinks smoothly and the chat takes over.
- [ ] Your messages are blue bubbles on the right; JARVIS replies have a glowing edge, a source tag (On-device / Online AI / System) and a Copy button.
- [ ] Thinking dots show while JARVIS works; reactor shows the scanning sweep.
- [ ] Mic button opens voice mode: orb is disabled and says voice is not installed. "Preview" runs a labelled `· DEMO` animation, with no microphone.
- [ ] History rows: tap one of your messages to put it back in the input box. Delete needs two taps.
- [ ] Settings: toggles for haptics and low-effects mode persist after closing the app.
- [ ] Rotate the phone: landscape shows reactor on the left, chat on the right.
- [ ] Android back button closes an open panel instead of leaving the app.

## Test checklist (on your phone)
- [ ] App opens full screen, black with blue glow; Arc Reactor rotates slowly.
- [ ] Type `what time is it` → current time (answered on-device, works in airplane mode).
- [ ] Type `Jarvis enna panra?` → Thanglish reply.
- [ ] Type `நேரம் என்ன` and `aaj kya tarikh hai` → Tamil / Hinglish replies.
- [ ] Type `battery` → battery %.
- [ ] Type `Amma ku call pannu` → honest "not built yet (Milestone 4)".
- [ ] Airplane mode: status pill turns amber "Offline"; `weather` says it needs internet.
- [ ] Settings → Preview states: Listening / Thinking / Speaking animate differently.
- [ ] History button shows the conversation; "Delete" clears it.
- [ ] Mic button says voice arrives in Milestone 3 (not faked).

## Online AI contract (built in Milestone 2)
App → `POST <your proxy URL>` `{ "messages": [{role, content}], "lang": "en|ta|tg|hi|hg" }`
Proxy → `{ "reply": "text" }`. The AI provider key lives only in the proxy.

## Notes
- The `android/` folder is generated on the first build and committed back to the repo, so native code can be added from Stage 4 onward.
- Capacitor stays on v6 for now (no feature needs 7/8 yet; we will recheck at the native-plugin stage).
- Debug APK is for your own use. Play Store release signing comes later.
