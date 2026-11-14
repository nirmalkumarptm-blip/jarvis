#!/usr/bin/env bash
# Creates (first run) or decrypts (later runs) JARVIS's stable APK signing key.
# The key lives in the repo ONLY in encrypted form (signing/jarvis.keystore.enc).
# The passphrase lives ONLY in the GitHub secret JARVIS_KEY_PASSPHRASE.
set -euo pipefail

ENC="signing/jarvis.keystore.enc"

if [ -z "${JARVIS_KS_PASS:-}" ]; then
  echo "::warning::Secret JARVIS_KEY_PASSPHRASE is not set, so this build uses a temporary debug key. Updating an installed copy will fail until you uninstall it first (this deletes downloaded models and memory). See README step 'Stable signing key'."
  exit 0
fi

KS="${JARVIS_KS_PATH:-${RUNNER_TEMP:-/tmp}/jarvis.keystore}"
mkdir -p signing

if [ -f "$ENC" ]; then
  if ! openssl enc -d -aes-256-cbc -pbkdf2 -in "$ENC" -out "$KS" -pass env:JARVIS_KS_PASS 2>/dev/null; then
    echo "::error::Could not decrypt $ENC. JARVIS_KEY_PASSPHRASE does not match the one used when the key was created. Restore the old passphrase, or delete $ENC to create a NEW key (you will then need to uninstall the old app once)."
    exit 1
  fi
else
  rm -f "$KS"
  keytool -genkeypair -keystore "$KS" -alias jarvis -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass:env JARVIS_KS_PASS -keypass:env JARVIS_KS_PASS \
    -dname "CN=JARVIS Personal, O=JARVIS, C=IN" >/dev/null 2>&1
  openssl enc -aes-256-cbc -pbkdf2 -salt -in "$KS" -out "$ENC" -pass env:JARVIS_KS_PASS
  echo "Created new signing key (encrypted copy at $ENC)."
fi

# Sanity check: the key must open with this passphrase (catches a rare false-positive decrypt).
if ! keytool -list -keystore "$KS" -alias jarvis -storepass:env JARVIS_KS_PASS >/dev/null 2>&1; then
  echo "::error::Signing key could not be opened with JARVIS_KEY_PASSPHRASE."
  exit 1
fi

if [ -n "${GITHUB_ENV:-}" ]; then
  echo "JARVIS_KEYSTORE=$KS" >> "$GITHUB_ENV"
fi
echo "Signing key ready."
