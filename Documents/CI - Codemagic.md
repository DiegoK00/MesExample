# CI - Codemagic (iOS & Android Release)

Codemagic gestisce i build di **release mobile** che richiedono macOS/Xcode (impossibili su GitHub Actions gratuito con runner Linux).  
Il file di configurazione è `codemagic.yaml` nella root del progetto.

GitHub Actions continua a gestire API, Web e test Flutter — Codemagic si occupa solo dei build di distribuzione.

---

## Workflow definiti

| Workflow | Trigger | Runner | Output |
|----------|---------|--------|--------|
| `flutter-ios-release` | push su `main` | mac_mini_m2 | `.ipa` → TestFlight |
| `flutter-android-release` | push su `main` | mac_mini_m2 | `.aab` → Google Play Internal |
| `flutter-test` | pull request su `main` | linux_x2 | solo test + analyze |

---

## Setup iniziale (da fare una volta)

### 1. Connetti il repository

1. Vai su [codemagic.io](https://codemagic.io) e crea un account
2. **Add application** → seleziona il repository GitHub
3. Scegli **"Flutter App"** come tipo
4. Codemagic rileva automaticamente `codemagic.yaml`

### 2. Variabili d'ambiente

Nel dashboard Codemagic → **Environment variables**, aggiungi:

| Variabile | Valore | Gruppo |
|-----------|--------|--------|
| `API_BASE_URL` | `https://api.mesclaude.com` | `production` |
| `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` | JSON service account Google Play | `android` |

### 3. Code signing iOS

1. Dashboard → **Teams > Integrations > Developer Portal**
2. Connetti il tuo Apple Developer account con una **App Store Connect API key**
3. Codemagic gestisce automaticamente certificati e provisioning profile

Dati necessari:
- `BUNDLE_ID`: `com.mesclaude.app` (già in `codemagic.yaml`)
- Tipo distribuzione: `app_store` per TestFlight / App Store

### 4. Code signing Android

1. Genera un keystore release (se non esiste):
   ```bash
   keytool -genkey -v -keystore mesclaude.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mesclaude
   ```
2. Dashboard → **Code signing > Android keystores** → carica `mesclaude.jks`
3. Assegna il nome `mesclaude_keystore` (corrisponde al nome nel `codemagic.yaml`)

### 5. Google Play (per publish automatico)

1. Crea un service account su Google Cloud Console con accesso a Google Play
2. Scarica il JSON e incollalo nella variabile `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`

---

## Relazione con GitHub Actions

| Cosa | Dove |
|------|------|
| Build + test API | GitHub Actions (`api-build`, `api-test`, `api-playwright`) |
| Build + test Web Angular | GitHub Actions (`web-test`, `web-playwright`) |
| Test Flutter + APK debug | GitHub Actions (`mobile-test`) |
| **IPA release iOS** | **Codemagic** (`flutter-ios-release`) |
| **AAB release Android** | **Codemagic** (`flutter-android-release`) |

---

## Note

- Il workflow `flutter-test` su Codemagic esegue gli stessi test del job `mobile-test` su GitHub Actions ma su PR — fornisce un secondo check indipendente.
- `submit_to_testflight: true` carica automaticamente su TestFlight dopo ogni push a `main`. Disabilita se preferisci caricare manualmente.
- `submit_as_draft: true` su Google Play pubblica in bozza — richiede promozione manuale al track successivo.
- I file `config/env.*.json` **non devono essere committati** — le variabili vengono iniettate via `--dart-define` da Codemagic.
