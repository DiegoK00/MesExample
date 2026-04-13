# Comandi di Avvio

## API (.NET)

```bash
cd C:/Personal/Workspace/MesClaude/api
dotnet run

# Test unitari
cd C:/Personal/Workspace/MesClaude/Api_Test
dotnet test

# Test E2E (WebApplicationFactory)
cd C:/Personal/Workspace/MesClaude/Api_E2E
dotnet test

# Test E2E (Playwright + Kestrel reale)
cd C:/Personal/Workspace/MesClaude/Api_Playwright
dotnet test
```

### Debug con Breakpoint (VS Code)

**Prerequisiti**: Estensione **C# DevKit** installata

**Steps**:
1. Apri Debug in VS Code: `Ctrl+Shift+D`
2. Seleziona **"API — Debug (http://localhost:5260)"**
3. Premi **F5** o clicca ▶ (Start Debugging)
4. Aggiungi breakpoints nei file `.cs` con un click sul numero di riga
5. L'API avvia e si ferma ai breakpoint
6. Usa Console di Debug per ispezionare variabili

**Comandi utili**:
- **F5**: Continua esecuzione
- **F10**: Step over
- **F11**: Step into  
- **Shift+F11**: Step out
- **Ctrl+Shift+D**: Debug console

---

## Web (Angular)

```bash
cd C:/Personal/Workspace/MesClaude/web

# Avvio dev server
npx ng serve

# Test unitari
npx ng test --watch=false --browsers=ChromeHeadless

# Test E2E Playwright
npm run e2e

# Report HTML dopo E2E
npm run e2e:report
```

### Debug con Breakpoint (VS Code)

**Prerequisiti**: Estensione **Debugger for Chrome** installata

**Steps**:
1. Apri Debug in VS Code: `Ctrl+Shift+D`
2. Seleziona **"Debug — ng serve (localhost:4200)"**
3. Premi **F5** o clicca ▶ (Start Debugging)
4. Chrome si apre automaticamente
5. Aggiungi breakpoints nei file `.ts` e `.html`
6. L'app si ferma ai breakpoint, ispeziona variabili nel Debug Panel

**Note**:
- I breakpoint vengono sincronizzati tra VS Code e Chrome DevTools
- Modifiche al codice durante il debug vengono applicate con hot reload
- Puoi usare sia VS Code che Chrome DevTools

---

## Mobile (Flutter)

```bash
cd C:/Personal/Workspace/MesClaude/mobile

# Installazione dipendenze
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs

# Avvio DEV — Android emulator CON DEBUG
flutter run --dart-define-from-file=config/env.dev.android.json

# Avvio DEV — iOS simulator CON DEBUG
flutter run --dart-define-from-file=config/env.dev.ios.json

# Avvio senza file (usa default: Android emulator http://10.0.2.2:5260)
flutter run

# Build RELEASE produzione
flutter build apk --dart-define-from-file=config/env.prod.json
flutter build ipa --dart-define-from-file=config/env.prod.json

# Test unitari e widget
flutter test

# Test E2E integration (richiede emulatore/device)
flutter test integration_test/app_test.dart

# Rigenera i mock mockito (dopo modifiche a @GenerateMocks)
flutter pub run build_runner build --delete-conflicting-outputs
```

### Debug con Breakpoint (VS Code)

**Prerequisiti**: Estensione **Flutter** installata

**Steps**:
1. Avvia un emulatore o device
2. Apri Debug in VS Code: `Ctrl+Shift+D`
3. Seleziona **"Debug — Android"** o **"Debug — iOS"**
4. Premi **F5** o clicca ▶ (Start Debugging)
5. L'app si compila e lancia sull'emulatore con debug
6. Aggiungi breakpoints nei file `.dart`
7. L'app si ferma ai breakpoint

**Comandi utili**:
- **F5**: Continua
- **F10**: Step over
- **F11**: Step into
- Scrivi comandi di Dart nella Debug Console (es: `print(variable.toString())`)

**Hot Reload durante Debug**:
- Mentre il debugger è attivo, premi **r** nella console per hot reload (mantiene stato app)
- Premi **R** (maiuscolo) per hot restart (resetta stato app)

---

## Debug Full Stack (Simultaneo)

### Opzione 1: Da VS Code (Root)

1. Apri Debug in VS Code sulla **cartella principale** (`C:/Personal/Workspace/MesClaude`)
2. Seleziona **"Full Stack Debug (API + Web + Mobile)"** o **"API + Web"**
3. Premi **F5**
4. Tutti i debugger si avviano in parallelo:
   - API: `localhost:5260` con breakpoints in C#
   - Web: `localhost:4200` con breakpoints in TypeScript
   - Mobile: Emulatore/device con breakpoints in Dart

### Opzione 2: Manuale (Tre Terminal)

```bash
# Terminal 1 — API
cd api && dotnet run

# Terminal 2 — Web
cd web && npx ng serve

# Terminal 3 — Mobile
cd mobile && flutter run --dart-define-from-file=config/env.dev.android.json
```

Poi attacca i debugger da VS Code a ognuno.

---

## Configurazioni VS Code

- **Root**: `C:/Personal/Workspace/MesClaude/.vscode/launch.json` e `tasks.json`
- **Mobile**: `mobile/.vscode/launch.json` (Dev Android, Dev iOS, Release)
- **Web**: `web/.vscode/launch.json` (ng serve, ng test, E2E)
- **API**: Usa la config root

> Tutte le configurazioni supportano hot reload/hot restart dove applicabile.

